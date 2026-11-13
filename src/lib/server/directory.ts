// The directory API behind /api/directorio/* (port of the directory-api Edge Function of Cancún
// Tech Day). Sign-in is an email plus a 6-digit code; every write is keyed on the email of the
// signed session, never on an id from the client.
//   POST   request-code {email}   -> emails a 6-digit code (any valid email can create a profile)
//   POST   verify-code {email, code} -> checks it, sets the session cookie, returns the profile
//   POST   logout                 -> clears the session cookie
//   GET    profile                -> the signed-in person's profile (null if none yet)
//   POST   profile                -> validates and saves it; the first save claims or creates it
//   POST   photo (multipart "photo") -> replaces the photo in the public directory-photos bucket
//   DELETE photo                  -> removes it
import { randomInt, randomUUID } from 'node:crypto';
import { CATEGORY_KEYS, EMAIL_RE, MAX_CATEGORIES, MAX_SERVICES } from '@/lib/directory/config';
import {
  HttpError,
  type Row,
  SupabaseError,
  clearedCookie,
  clientIp,
  env,
  escapeHtml,
  hmac,
  json,
  photoUrl,
  readJson,
  removePhoto,
  rest,
  rpc,
  sameHash,
  sendMail,
  sessionCookie,
  uploadPhoto,
} from './core';

const PHOTO_TYPES: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };
const MAX_PHOTO_BYTES = 3 * 1024 * 1024;

const CODE_TTL_MINUTES = 10;
const MAX_CODE_ATTEMPTS = 5;
const RESEND_COOLDOWN_SECONDS = 60;
const MAX_CODES_PER_EMAIL_HOUR = 5;
const MAX_CODES_PER_IP_HOUR = 20;
// Any address can ask for a code, so this caps how much mail the endpoint can ever send.
const MAX_CODES_PER_HOUR = 300;

// Public columns, plus what only the owner sees in their own editor.
const PUBLIC_COLUMNS = 'id,slug,name,kind,company,job_title,headline,description,services,categories,city,website,photo_path,updated_at';
const OWNER_COLUMNS = `${PUBLIC_COLUMNS},linkedin_url,whatsapp,email,status,published,source_events,claimed_at`;

// ---------- codes ----------

async function sendCodeEmail(to: string, code: string) {
  const intro = 'Usa este código para entrar a tu perfil en el directorio de CAHUSA MX:';
  const expiry = `Vence en ${CODE_TTL_MINUTES} minutos. Si no lo pediste, ignora este correo.`;
  const html = `<div style="font-family:Helvetica,Arial,sans-serif;color:#0A2558;max-width:480px">
  <p style="font-size:13px;font-weight:700;letter-spacing:.16em;color:#2E4F89;margin:0 0 16px">CAHUSA MX · DIRECTORIO</p>
  <p style="font-size:16px;line-height:1.5;margin:0 0 20px">${escapeHtml(intro)}</p>
  <p style="font-size:36px;font-weight:700;letter-spacing:.3em;margin:0 0 20px">${code}</p>
  <p style="font-size:14px;line-height:1.5;color:#6C6F77;margin:0">${escapeHtml(expiry)}</p>
</div>`;
  return sendMail({
    from: env.mailFrom,
    to: [to],
    subject: `${code} es tu código para el directorio de CAHUSA MX`,
    html,
    text: `${intro}\n\n${code}\n\n${expiry}`,
  });
}

async function requestCode(req: Request) {
  if (!env.resendKey) throw new HttpError(503, 'unavailable');
  const body = await readJson(req);
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase().slice(0, 200) : '';
  if (!EMAIL_RE.test(email)) throw new HttpError(422, 'email_invalid');

  const ip = clientIp(req);
  const ipHash = ip ? hmac(`ip:${ip}`) : null;
  const hourAgo = encodeURIComponent(new Date(Date.now() - 3600_000).toISOString());
  const [recent, byIp, total] = await Promise.all([
    rest<Row[]>(`directory_email_codes?select=created_at&email=eq.${encodeURIComponent(email)}&created_at=gte.${hourAgo}&order=created_at.desc`),
    ipHash ? rest<Row[]>(`directory_email_codes?select=id&ip_hash=eq.${ipHash}&created_at=gte.${hourAgo}`) : Promise.resolve([]),
    rest<Row[]>(`directory_email_codes?select=id&created_at=gte.${hourAgo}&limit=${MAX_CODES_PER_HOUR}`),
  ]);
  const last = recent[0] ? new Date(recent[0].created_at).getTime() : 0;
  if (Date.now() - last < RESEND_COOLDOWN_SECONDS * 1000) {
    return json({ ok: false, reason: 'cooldown', retryAfter: RESEND_COOLDOWN_SECONDS }, 429);
  }
  if (recent.length >= MAX_CODES_PER_EMAIL_HOUR || byIp.length >= MAX_CODES_PER_IP_HOUR || total.length >= MAX_CODES_PER_HOUR) {
    throw new HttpError(429, 'rate_limited');
  }

  const code = String(randomInt(0, 1_000_000)).padStart(6, '0');
  const [created] = await rest<Row[]>('directory_email_codes?select=id', {
    method: 'POST',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify({
      email,
      ip_hash: ipHash,
      code_hash: hmac(`${email}:${code}`),
      expires_at: new Date(Date.now() + CODE_TTL_MINUTES * 60_000).toISOString(),
    }),
  });
  if (!(await sendCodeEmail(email, code))) throw new HttpError(503, 'unavailable');
  await rest(`directory_email_codes?id=eq.${created.id}`, { method: 'PATCH', body: JSON.stringify({ sent: true }) });
  return json({ ok: true, retryAfter: RESEND_COOLDOWN_SECONDS });
}

async function verifyCode(req: Request) {
  const body = await readJson(req);
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase().slice(0, 200) : '';
  const code = typeof body.code === 'string' ? body.code.replace(/\D/g, '') : '';
  if (!EMAIL_RE.test(email) || code.length !== 6) throw new HttpError(422, 'code_invalid');

  const [found] = await rest<Row[]>(
    `directory_email_codes?select=id,code_hash,attempts,expires_at,used_at&email=eq.${encodeURIComponent(email)}&sent=is.true&order=created_at.desc&limit=1`,
  );
  if (!found || found.used_at || new Date(found.expires_at).getTime() < Date.now() || found.attempts >= MAX_CODE_ATTEMPTS) {
    throw new HttpError(422, 'code_expired');
  }
  if (!sameHash(found.code_hash, hmac(`${email}:${code}`))) {
    await rest(`directory_email_codes?id=eq.${found.id}`, { method: 'PATCH', body: JSON.stringify({ attempts: found.attempts + 1 }) });
    throw new HttpError(422, MAX_CODE_ATTEMPTS - found.attempts - 1 > 0 ? 'code_invalid' : 'code_expired');
  }
  await rest(`directory_email_codes?id=eq.${found.id}`, { method: 'PATCH', body: JSON.stringify({ used_at: new Date().toISOString() }) });
  return json({ ok: true, email, profile: view(await row(email)) }, 200, { 'Set-Cookie': sessionCookie(email) });
}

// ---------- validation (mirrors the checks on public.directory_profiles) ----------

const text = (v: unknown, max: number) => {
  if (typeof v !== 'string') return null;
  const s = v.replace(/\r\n?/g, '\n').trim();
  return s ? s.slice(0, max) : null;
};
const line = (v: unknown, max: number) => {
  const s = text(v, max * 2)?.replace(/\s+/g, ' ');
  return s ? s.slice(0, max) : null;
};

function normalizeUrl(v: unknown): string | null | false {
  const s = line(v, 300);
  if (!s) return null;
  try {
    const url = new URL(/^https?:\/\//i.test(s) ? s : `https://${s}`);
    if (!/^https?:$/.test(url.protocol) || !url.hostname.includes('.') || /\s/.test(s)) return false;
    return url.href.slice(0, 300);
  } catch {
    return false;
  }
}

function normalizeLinkedin(v: unknown): string | null | false {
  const url = normalizeUrl(v);
  if (!url) return url;
  const parsed = new URL(url);
  if (!/(^|\.)linkedin\.com$/i.test(parsed.hostname) || parsed.pathname.length < 2) return false;
  return `https://${parsed.hostname.toLowerCase()}${parsed.pathname}`.replace(/\/+$/, '').slice(0, 300);
}

/** Digits with country code. A 10-digit number is taken as Mexican (52). */
function normalizeWhatsapp(v: unknown): string | null | false {
  const raw = line(v, 40);
  if (!raw) return null;
  let digits = raw.replace(/\D/g, '');
  if (digits.length === 10) digits = `52${digits}`;
  return /^[0-9]{8,15}$/.test(digits) ? digits : false;
}

function validateProfile(body: Row): { ok: true; value: Row } | { ok: false; fields: string[] } {
  const fields: string[] = [];
  const name = line(body.name, 120);
  if (!name) fields.push('name');

  const rawServices: unknown[] = Array.isArray(body.services)
    ? body.services
    : typeof body.services === 'string'
      ? body.services.split('\n')
      : [];
  const services = [...new Set(rawServices.map((s) => line(s, 200)).filter((s): s is string => !!s))];
  if (services.length > MAX_SERVICES || services.some((s) => s.length > 60)) fields.push('services');

  const rawCategories: unknown[] = Array.isArray(body.categories) ? body.categories : [];
  const categories = [...new Set(rawCategories.filter((c): c is string => (CATEGORY_KEYS as readonly string[]).includes(c as string)))];
  if (categories.length > MAX_CATEGORIES) fields.push('categories');

  const website = normalizeUrl(body.website);
  if (website === false) fields.push('website');
  const linkedin_url = normalizeLinkedin(body.linkedin_url);
  if (linkedin_url === false) fields.push('linkedin_url');
  const whatsapp = normalizeWhatsapp(body.whatsapp);
  if (whatsapp === false) fields.push('whatsapp');

  if (fields.length) return { ok: false, fields };
  return {
    ok: true,
    value: {
      kind: body.kind === 'company' ? 'company' : 'professional',
      name,
      company: line(body.company, 120),
      job_title: line(body.job_title, 120),
      headline: line(body.headline, 160),
      description: text(body.description, 2000),
      services,
      categories,
      city: line(body.city, 80),
      website: website || null,
      linkedin_url: linkedin_url || null,
      whatsapp: whatsapp || null,
      published: body.published === true,
    },
  };
}

// ---------- the owner's row ----------

async function row(email: string): Promise<Row | null> {
  const [found] = await rest<Row[]>(`directory_profiles?email=eq.${encodeURIComponent(email)}&select=${OWNER_COLUMNS}`);
  return found ?? null;
}

function view(p: Row | null) {
  if (!p) return null;
  const { photo_path, ...others } = p;
  return { ...others, photo_url: photoUrl(photo_path) };
}

const claim = (p: Row | null) => ({ status: 'claimed', claimed_at: p?.claimed_at ?? new Date().toISOString() });

const patch = async (id: string, values: Row) =>
  (
    await rest<Row[]>(`directory_profiles?id=eq.${id}&select=${OWNER_COLUMNS}`, {
      method: 'PATCH',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify(values),
    })
  )[0];

/** A row for this email, created (claimed, unpublished) when the email was never imported. */
async function ensureRow(email: string, name: string): Promise<Row> {
  const existing = await row(email);
  if (existing) return existing;
  try {
    const [created] = await rest<Row[]>(`directory_profiles?select=${OWNER_COLUMNS}`, {
      method: 'POST',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify({ email, name, ...claim(null) }),
    });
    return created;
  } catch (err) {
    // Two tabs saving at once: the other one created it.
    if (err instanceof SupabaseError && err.code === '23505') return (await row(email))!;
    throw err;
  }
}

async function saveProfile(email: string, input: Row) {
  const current = await ensureRow(email, input.name);
  for (let attempt = 0; ; attempt++) {
    // The public URL is fixed the first time the profile is published; renaming keeps it.
    const slug = current.slug ?? (input.published ? await rpc<string>('directory_free_slug', { p_name: input.name, p_id: current.id }) : null);
    try {
      return view(await patch(current.id, { ...input, slug, ...claim(current) }));
    } catch (err) {
      // Someone took the same slug between directory_free_slug and the PATCH: pick again.
      if (err instanceof SupabaseError && err.code === '23505' && !current.slug && attempt < 2) continue;
      throw err;
    }
  }
}

async function profile(req: Request, email: string) {
  if (req.method === 'GET') return json({ ok: true, email, profile: view(await row(email)) });
  if (req.method !== 'POST') throw new HttpError(405, 'method_not_allowed');
  const body = await readJson(req);
  const result = validateProfile(body);
  if ('fields' in result) return json({ ok: false, reason: 'invalid', fields: result.fields }, 422);
  return json({ ok: true, email, profile: await saveProfile(email, result.value) });
}

// ---------- photo ----------

// The file's first bytes, so a renamed non-image is rejected whatever its declared type.
function sniff(bytes: Uint8Array): string | null {
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'image/jpeg';
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return 'image/png';
  const tag = (o: number) => String.fromCharCode(...bytes.slice(o, o + 4));
  if (tag(0) === 'RIFF' && tag(8) === 'WEBP') return 'image/webp';
  return null;
}

async function photo(req: Request, email: string) {
  if (req.method !== 'POST' && req.method !== 'DELETE') throw new HttpError(405, 'method_not_allowed');
  const current = await row(email);

  if (req.method === 'DELETE') {
    if (!current) throw new HttpError(409, 'save_first');
    const saved = await patch(current.id, { photo_path: null });
    if (current.photo_path) await removePhoto(current.photo_path);
    return json({ ok: true, email, profile: view(saved) });
  }

  const form = await req.formData().catch(() => null);
  const file = form?.get('photo');
  if (!(file instanceof File)) throw new HttpError(422, 'photo_type');
  if (file.size > MAX_PHOTO_BYTES) throw new HttpError(413, 'photo_size');
  const bytes = await file.arrayBuffer();
  const type = sniff(new Uint8Array(bytes));
  if (!type) throw new HttpError(422, 'photo_type');
  if (!current) throw new HttpError(409, 'save_first');

  const path = `${current.id}/${randomUUID()}.${PHOTO_TYPES[type]}`;
  await uploadPhoto(path, bytes, type);
  const saved = await patch(current.id, { photo_path: path, ...claim(current) });
  if (current.photo_path) await removePhoto(current.photo_path);
  return json({ ok: true, email, profile: view(saved) });
}

// ---------- routing ----------

export async function handleDirectory(action: string, req: Request, email: string | null): Promise<Response> {
  if (action === 'request-code' || action === 'verify-code' || action === 'logout') {
    if (req.method !== 'POST') throw new HttpError(405, 'method_not_allowed');
    if (action === 'logout') return json({ ok: true }, 200, { 'Set-Cookie': clearedCookie });
    return action === 'request-code' ? requestCode(req) : verifyCode(req);
  }
  if (action === 'profile' || action === 'photo') {
    if (!email) throw new HttpError(401, 'unauthorized');
    return action === 'profile' ? profile(req, email) : photo(req, email);
  }
  throw new HttpError(404, 'not_found');
}
