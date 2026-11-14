#!/usr/bin/env node
// Gives imported directory profiles a photo: downloads each image, skips generic placeholders,
// normalizes it to a 400x400 WebP without metadata, uploads it to the public directory-photos
// bucket and sets directory_profiles.photo_path.
//
//   SUPABASE_URL=https://<ref>.supabase.co SUPABASE_SERVICE_ROLE_KEY=... \
//     node scripts/import-directory-photos.mjs --csv photos.csv [--csv more.csv] [--apply]
//
// Each CSV has the columns email,photo_url (e.g. Luma avatars from the calendar admin API, Google
// avatars of La Bolsa MX users). When an email appears more than once, the first file given wins;
// if its image fails or is a placeholder, the next one is tried.
//
// Only unclaimed profiles without a photo are touched: a person who claimed their profile chose
// their own photo (or none). Re-running is safe: profiles that already have a photo are skipped.
//
// Without --apply it is a dry run: it downloads and checks every image and prints counts, but
// uploads and writes nothing. Needs sharp (installed with Next.js).

import { readFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { createRequire } from 'node:module';
import { parseCsv, normEmail } from './import-luma-directory.mjs';

const sharp = createRequire(import.meta.url)('sharp');

const SUPABASE_URL = process.env.SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BUCKET = 'directory-photos';
const SIZE = 400;
const MAX_DOWNLOAD = 25 * 1024 * 1024;
const CONCURRENCY = 6;

function die(msg) {
  console.error(`import-directory-photos: ${msg}`);
  process.exit(1);
}

function parseArgs(argv) {
  const args = { csv: [], apply: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--csv') args.csv.push(argv[++i] ?? die('--csv needs a value'));
    else if (a === '--apply') args.apply = true;
    else if (a === '--help' || a === '-h') {
      console.log(readFileSync(new URL(import.meta.url)).toString().split('\n').filter((l) => l.startsWith('//')).map((l) => l.slice(3)).join('\n'));
      process.exit(0);
    } else die(`unknown argument: ${a}`);
  }
  if (!args.csv.length) die('pass at least one --csv with columns email,photo_url');
  if (!SUPABASE_URL || !KEY) die('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required (the dry run reads the profiles too)');
  return args;
}

const auth = () => ({ apikey: KEY, Authorization: `Bearer ${KEY}` });

async function rest(path, init = {}) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, { ...init, headers: { ...auth(), 'Content-Type': 'application/json', ...init.headers } });
  if (!res.ok) throw new Error(`${init.method ?? 'GET'} ${path.split('?')[0]} failed: ${res.status} ${await res.text()}`);
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

/** Google avatars come in a small size by default; ask for one as big as the photo we keep. */
export const biggerAvatar = (url) => url.replace(/(googleusercontent\.com\/.+)=s\d+(-c)?$/, `$1=s${SIZE}-c`);

/**
 * A generic placeholder rather than a photo or a logo: Google's white initial on a flat colour,
 * its grey "no photo" and blue silhouette icons, a blank square. Checked on a 48x48 thumbnail:
 * an image whose two most common colours cover 90% of it, or a flat non-white background with
 * only near-white marks on it. Some two-colour logos are lost too; that is the price of never
 * showing a placeholder.
 */
export async function isPlaceholder(buf) {
  const { data } = await sharp(buf).resize(48, 48, { fit: 'fill' }).flatten({ background: '#fff' }).raw().toBuffer({ resolveWithObject: true });
  const n = data.length / 3;
  const counts = new Map();
  for (let i = 0; i < data.length; i += 3) {
    const k = ((data[i] >> 4) << 8) | ((data[i + 1] >> 4) << 4) | (data[i + 2] >> 4);
    counts.set(k, (counts.get(k) ?? 0) + 1);
  }
  const top = [...counts.values()].sort((a, b) => b - a);
  if ((top[0] + (top[1] ?? 0)) / n >= 0.9) return true;

  const px = (i) => [data[i * 3], data[i * 3 + 1], data[i * 3 + 2]];
  const near = (a, b, t) => Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) + Math.abs(a[2] - b[2]) <= t;
  const white = [255, 255, 255];
  const bg = px(0);
  if (near(bg, white, 60)) return false;
  let bgN = 0;
  let whiteN = 0;
  for (let i = 0; i < n; i++) {
    const p = px(i);
    if (near(p, bg, 40)) bgN++;
    else if (near(p, white, 90)) whiteN++;
  }
  return bgN / n > 0.55 && (bgN + whiteN) / n > 0.9;
}

/** The image ready to upload, or the reason it was skipped. */
async function prepare(url) {
  let buf;
  try {
    const res = await fetch(biggerAvatar(url), { signal: AbortSignal.timeout(20000), headers: { 'User-Agent': 'cahusa-directory-import' } });
    if (!res.ok) return { skip: `http ${res.status}` };
    buf = Buffer.from(await res.arrayBuffer());
  } catch (err) {
    return { skip: `download: ${String(err.message ?? err).slice(0, 60)}` };
  }
  if (buf.length > MAX_DOWNLOAD) return { skip: 'too big' };
  try {
    if (await isPlaceholder(buf)) return { skip: 'placeholder' };
    // rotate() applies the EXIF orientation; sharp drops all metadata (EXIF, GPS) on output.
    const out = await sharp(buf).rotate().resize(SIZE, SIZE, { fit: 'cover', position: 'attention' }).webp({ quality: 85 }).toBuffer();
    return { bytes: out };
  } catch (err) {
    return { skip: `image: ${String(err.message ?? err).slice(0, 60)}` };
  }
}

async function allProfiles() {
  const out = new Map();
  for (let offset = 0; ; offset += 1000) {
    const page = await rest(`directory_profiles?select=id,email,status,photo_path&order=id&limit=1000&offset=${offset}`);
    for (const p of page) out.set(p.email, p);
    if (page.length < 1000) return out;
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const candidates = new Map(); // email -> [url, ...] in file order
  for (const file of args.csv) {
    const rows = parseCsv(readFileSync(file, 'utf8'));
    let n = 0;
    for (const r of rows) {
      const email = normEmail(r.email);
      const url = String(r.photo_url ?? '').trim();
      if (!email || !/^https:\/\//.test(url)) continue;
      const list = candidates.get(email) ?? [];
      if (!list.includes(url)) list.push(url);
      candidates.set(email, list);
      n++;
    }
    console.log(`csv: ${n} photos from ${file}`);
  }

  const profiles = await allProfiles();
  const todo = [];
  const stats = { not_in_directory: 0, claimed: 0, has_photo: 0 };
  for (const [email, urls] of candidates) {
    const p = profiles.get(email);
    if (!p) stats.not_in_directory++;
    else if (p.status === 'claimed') stats.claimed++;
    else if (p.photo_path) stats.has_photo++;
    else todo.push({ profile: p, urls });
  }
  console.log(`${candidates.size} people with a photo; skipped:`, stats, `; to check: ${todo.length}`);

  const result = { uploaded: 0, ready: 0, skipped: {} };
  let next = 0;
  async function worker() {
    while (next < todo.length) {
      const { profile, urls } = todo[next++];
      let done = false;
      let lastSkip = null;
      for (const url of urls) {
        const img = await prepare(url);
        if (img.skip) {
          lastSkip = img.skip.split(':')[0];
          continue;
        }
        if (!args.apply) {
          result.ready++;
          done = true;
          break;
        }
        const path = `${profile.id}/${randomUUID()}.webp`;
        const up = await fetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET}/${path}`, {
          method: 'POST',
          headers: { ...auth(), 'Content-Type': 'image/webp', 'x-upsert': 'false', 'cache-control': '31536000' },
          body: img.bytes,
        });
        if (!up.ok) throw new Error(`upload failed: ${up.status} ${await up.text()}`);
        // Only if still unclaimed and without a photo: the person may have claimed it meanwhile.
        const saved = await rest(`directory_profiles?id=eq.${profile.id}&status=eq.unclaimed&photo_path=is.null`, {
          method: 'PATCH',
          headers: { Prefer: 'return=representation' },
          body: JSON.stringify({ photo_path: path }),
        });
        if (saved?.length) result.uploaded++;
        else {
          await fetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET}`, {
            method: 'DELETE',
            headers: { ...auth(), 'Content-Type': 'application/json' },
            body: JSON.stringify({ prefixes: [path] }),
          });
          lastSkip = 'changed meanwhile';
          break;
        }
        done = true;
        break;
      }
      if (!done && lastSkip) result.skipped[lastSkip] = (result.skipped[lastSkip] ?? 0) + 1;
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));

  if (args.apply) console.log('applied:', { uploaded: result.uploaded, skipped: result.skipped });
  else console.log('dry run:', { ready_to_upload: result.ready, skipped: result.skipped }, '— nothing written. Add --apply to upload.');
}

if (import.meta.url === `file://${process.argv[1]}`) main().catch((err) => die(err.message));
