// GET /api/directorio/ctd-sync: keeps this directory and cancuntech.day/directorio in step (Vercel
// cron, every 10 minutes; see vercel.json). Two steps, each on its own:
//
// 1. Push: our profiles go to cancuntech.day. Published profiles travel with their public data, the
//    email (so the person can claim the copy there and receive intros) and LinkedIn. Someone who
//    left (claimed and unpublished, or connect_opt_out) travels only as the sha-256 of their email,
//    so cancuntech.day can hide its copy without learning an email it didn't have. Drafts that were
//    never published don't travel. Rules there: cancuntech.day
//    supabase/migrations/20261114220000_directory_cahusamex_sync.sql.
// 2. Pull: cancuntech.day's own profiles come here, through its token-gated
//    directory_cahusamex_export (cancuntech.day 20261115120000_directory_cahusamex_export.sql), and
//    are applied by directory_ctd_sync / directory_ctd_finish (our 20261115120000_directory_ctd_sync.sql).
//    Skipped while CTD_EXPORT_TOKEN is not set.
//
// No loops: an unclaimed copy of one of their profiles (source_events exactly {cancuntechday}) is
// never pushed back, and they never export an unclaimed copy of ours. A profile unpublished here
// only because it left cancuntech.day is "held": counted as seen there, nothing else.
//
// ?dry=1 runs everything on both sides and rolls it back, returning the counts.
import { createHash } from 'node:crypto';
import { env, json, rest, rpc, type Row } from '@/lib/server/core';

export const dynamic = 'force-dynamic';
export const maxDuration = 120;

const CTD_URL = 'https://mmpdnezqnwcfjjguvdcw.supabase.co';
const CTD_RPC = `${CTD_URL}/rest/v1/rpc`;
const CTD_PHOTOS = `${CTD_URL}/storage/v1/object/public/directory-photos/`;
// cancuntech.day's publishable key: public by design. The tokens are what authorize each call.
const CTD_KEY = 'sb_publishable_MxzeOQQYXeG4lD_5J1txiA_X5cfxMh9';
// cancuntech.day gives anon 3 s per statement: 250 profiles per push and 500 per export page stay well under it.
const PUSH_BATCH = 250;
const EXPORT_PAGE = 500;
const APPLY_BATCH = 500;
const COLUMNS =
  'email,status,published,connect_opt_out,source_events,ctd_status,name,kind,company,job_title,headline,description,services,categories,city,website,linkedin_url,photo_path';

const sha256 = (email: string) => createHash('sha256').update(email.trim().toLowerCase(), 'utf8').digest('hex');

async function ctd(fn: string, body: Record<string, unknown>) {
  const res = await fetch(`${CTD_RPC}/${fn}`, {
    method: 'POST',
    cache: 'no-store',
    headers: { apikey: CTD_KEY, Authorization: `Bearer ${CTD_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`cancuntech.day ${fn} ${res.status}: ${text.slice(0, 300)}`);
  return JSON.parse(text) as Record<string, unknown>;
}

function addCounts(totals: Record<string, number>, res: Record<string, unknown>) {
  for (const [k, v] of Object.entries(res)) if (typeof v === 'number') totals[k] = (totals[k] ?? 0) + v;
}

/** An unclaimed profile that only exists here because cancuntech.day has it. */
const isCtdCopy = (p: Row) =>
  p.status !== 'claimed' && Array.isArray(p.source_events) && p.source_events.length === 1 && p.source_events[0] === 'cancuntechday';

async function push(profiles: Row[], token: string, dryRun: boolean) {
  const photoBase = `${env.supabaseUrl}/storage/v1/object/public/directory-photos/`;
  const rows: Row[] = [];
  const seen: string[] = [];
  let held = 0;
  for (const p of profiles) {
    if (isCtdCopy(p)) continue; // theirs: never sent back
    const hash = sha256(p.email);
    if (p.published && !p.connect_opt_out) {
      rows.push({
        email: p.email,
        status: p.status,
        name: p.name,
        kind: p.kind,
        company: p.company,
        job_title: p.job_title,
        headline: p.headline,
        description: p.description,
        services: p.services,
        categories: p.categories,
        city: p.city,
        website: p.website,
        linkedin_url: p.linkedin_url,
        // A photo kept in cancuntech.day's bucket is theirs already: only our own paths travel.
        photo_url: p.photo_path && !p.photo_path.startsWith('https://') ? photoBase + p.photo_path : null,
      });
    } else if (p.connect_opt_out || p.status === 'claimed') {
      rows.push({ email_sha256: hash, hidden: true });
    } else if (p.ctd_status === 'hidden') {
      held++; // unpublished here only because it left there: seen, nothing else
    } else {
      continue; // a private draft: never published here, never sent
    }
    seen.push(hash);
  }

  const totals: Record<string, number> = {};
  for (let i = 0; i < rows.length; i += PUSH_BATCH) {
    addCounts(totals, await ctd('directory_cahusamex_sync', { p_token: token, p_rows: rows.slice(i, i + PUSH_BATCH), p_dry_run: dryRun }));
  }
  const finish = await ctd('directory_cahusamex_finish', { p_token: token, p_seen: seen, p_dry_run: dryRun });
  return { sent: rows.length, held, ...totals, finish };
}

async function pull(token: string, dryRun: boolean) {
  const rows: Row[] = [];
  const seen: string[] = [];
  let held = 0;
  for (let after: string | null = null, pages = 0; pages < 100; pages++) {
    const page = (await ctd('directory_cahusamex_export', { p_token: token, p_after: after, p_limit: EXPORT_PAGE })) as {
      rows: Row[];
      next: string | null;
    };
    for (const r of page.rows) {
      if (r.held) {
        held++;
        seen.push(String(r.email_sha256));
        continue;
      }
      if (r.hidden) {
        rows.push({ email_sha256: r.email_sha256, hidden: true });
        seen.push(String(r.email_sha256));
        continue;
      }
      const { photo_path, ...data } = r;
      // cancuntech.day photos stay in its bucket; one of ours (a copy claimed there) comes back as our URL.
      rows.push({ ...data, photo_url: !photo_path ? null : photo_path.startsWith('https://') ? photo_path : CTD_PHOTOS + photo_path });
      seen.push(sha256(r.email));
    }
    if (!page.next) break;
    after = page.next;
  }

  const totals: Record<string, number> = {};
  for (let i = 0; i < rows.length; i += APPLY_BATCH) {
    addCounts(totals, await rpc<Row>('directory_ctd_sync', { p_rows: rows.slice(i, i + APPLY_BATCH), p_dry_run: dryRun }));
  }
  const finish = await rpc<Row>('directory_ctd_finish', { p_seen: seen, p_dry_run: dryRun });
  return { received: rows.length, held, ...totals, finish };
}

export async function GET(req: Request) {
  // Vercel sends the cron with Authorization: Bearer $CRON_SECRET.
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || req.headers.get('authorization') !== `Bearer ${cronSecret}`) {
    return json({ ok: false, reason: 'unauthorized' }, 401);
  }
  const pushToken = process.env.CTD_SYNC_TOKEN;
  const exportToken = process.env.CTD_EXPORT_TOKEN;
  if (!pushToken || !env.supabaseUrl || !env.serviceKey) return json({ ok: false, reason: 'unavailable' }, 503);
  const dryRun = new URL(req.url).searchParams.get('dry') === '1';

  const result: Record<string, unknown> = { ok: true, dryRun };
  try {
    const profiles: Row[] = [];
    for (let offset = 0; ; offset += 1000) {
      const page = await rest<Row[]>(`directory_profiles?select=${COLUMNS}&order=id.asc&limit=1000&offset=${offset}`);
      profiles.push(...page);
      if (page.length < 1000) break;
    }
    result.push = await push(profiles, pushToken, dryRun);
  } catch (err) {
    console.error('ctd sync push failed', err);
    result.ok = false;
    result.push = { failed: true };
  }

  if (exportToken) {
    try {
      result.pull = await pull(exportToken, dryRun);
    } catch (err) {
      console.error('ctd sync pull failed', err);
      result.ok = false;
      result.pull = { failed: true };
    }
  } else {
    result.pull = { skipped: 'CTD_EXPORT_TOKEN not set' };
  }

  console.log('ctd sync', JSON.stringify(result));
  return json(result, result.ok ? 200 : 502);
}
