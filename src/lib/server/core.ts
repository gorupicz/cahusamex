// Server-only plumbing shared by /api/directorio/* and /api/directorio/connect/*: environment,
// Supabase (PostgREST and Storage with the service role), JSON responses, the session cookie and
// Resend. Never import this from a client component: it reads the service role key.
import { createHmac, timingSafeEqual } from 'node:crypto';
import { EMAIL_RE } from '@/lib/directory/config';

// ---------- environment ----------

export const env = {
  supabaseUrl: process.env.SUPABASE_URL ?? '',
  anonKey: process.env.SUPABASE_ANON_KEY ?? '',
  serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? '',
  /** HMAC key for the session cookie, sign-in codes, IP hashes and match tokens. */
  sessionSecret: process.env.DIRECTORY_SESSION_SECRET ?? '',
  resendKey: process.env.RESEND_API_KEY ?? '',
  anthropicKey: process.env.ANTHROPIC_API_KEY ?? '',
  stripeKey: process.env.STRIPE_SECRET_KEY ?? '',
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET ?? '',
  stripePriceBusiness: process.env.STRIPE_PRICE_BUSINESS ?? '',
  stripePriceBusinessPlus: process.env.STRIPE_PRICE_BUSINESS_PLUS ?? '',
  siteUrl: (process.env.SITE_URL || 'https://cahusa.mx').replace(/\/+$/, ''),
  /** Sender of the sign-in codes. */
  mailFrom: process.env.DIRECTORY_MAIL_FROM || 'CAHUSA MX <directorio@cahusa.mx>',
};

/** The directory needs the database and the session secret; without them every route answers unavailable. */
export const backendReady = () => !!(env.supabaseUrl && env.serviceKey && env.sessionSecret.length >= 32);

// ---------- responses ----------

export class HttpError extends Error {
  constructor(public status: number, public reason: string) {
    super(reason);
  }
}

export function json(body: unknown, status = 200, headers: HeadersInit = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...headers },
  });
}

/** Writes must come from this site: a form on another origin can't spend a member's intros. */
export function sameOrigin(req: Request) {
  const origin = req.headers.get('origin');
  if (!origin) return req.headers.get('sec-fetch-site') !== 'cross-site';
  try {
    return new URL(origin).host === (req.headers.get('x-forwarded-host') ?? req.headers.get('host'));
  } catch {
    return false;
  }
}

/** Vercel sets x-forwarded-for itself (the client can't spoof the first hop there). */
export const clientIp = (req: Request) =>
  req.headers.get('x-forwarded-for')?.split(',')[0].trim() || req.headers.get('x-real-ip') || '';

export async function readJson(req: Request): Promise<Record<string, unknown>> {
  const body = await req.json().catch(() => null);
  return body && typeof body === 'object' && !Array.isArray(body) ? (body as Record<string, unknown>) : {};
}

// ---------- Supabase ----------

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Row = Record<string, any>;

export class SupabaseError extends Error {
  constructor(public status: number, public body: string, public code?: string, public detail?: string) {
    super(`supabase ${status}: ${body}`);
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function rest<T = any>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${env.supabaseUrl}/rest/v1/${path}`, {
    ...init,
    cache: 'no-store',
    headers: {
      apikey: env.serviceKey,
      Authorization: `Bearer ${env.serviceKey}`,
      'Content-Type': 'application/json',
      ...init.headers,
    },
  });
  const text = await res.text();
  if (!res.ok) {
    let code: string | undefined;
    let message: string | undefined;
    try {
      ({ code, message } = JSON.parse(text));
    } catch {
      /* not JSON */
    }
    throw new SupabaseError(res.status, text, code, message);
  }
  return text ? JSON.parse(text) : (null as T);
}

export const rpc = <T>(fn: string, args: Row) => rest<T>(`rpc/${fn}`, { method: 'POST', body: JSON.stringify(args) });
export const inList = (ids: string[]) => `(${ids.map((id) => encodeURIComponent(id)).join(',')})`;
export const isUuid = (v: unknown): v is string =>
  typeof v === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);

export const PHOTO_BUCKET = 'directory-photos';
export const photoUrl = (path: string | null | undefined) =>
  path ? `${env.supabaseUrl}/storage/v1/object/public/${PHOTO_BUCKET}/${path}` : null;

const storageAuth = () => ({ apikey: env.serviceKey, Authorization: `Bearer ${env.serviceKey}` });

export async function uploadPhoto(path: string, bytes: ArrayBuffer, contentType: string) {
  const res = await fetch(`${env.supabaseUrl}/storage/v1/object/${PHOTO_BUCKET}/${path}`, {
    method: 'POST',
    headers: { ...storageAuth(), 'Content-Type': contentType, 'x-upsert': 'false', 'cache-control': '31536000' },
    body: bytes,
  });
  if (!res.ok) throw new SupabaseError(res.status, await res.text());
}

export async function removePhoto(path: string) {
  const res = await fetch(`${env.supabaseUrl}/storage/v1/object/${PHOTO_BUCKET}`, {
    method: 'DELETE',
    headers: { ...storageAuth(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ prefixes: [path] }),
  });
  if (!res.ok) console.error('directory photo delete failed', path, res.status, await res.text());
}

// ---------- hashing and the session ----------

export const hmac = (value: string) => createHmac('sha256', env.sessionSecret).update(value).digest('hex');

export function sameHash(a: string, b: string) {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

const SESSION_COOKIE = 'cahusa_directory';
export const SESSION_HOURS = 2;
// Path=/api/directorio: the cookie only travels to the API, and Connect (under the same path)
// reuses the directory sign-in.
const COOKIE_ATTRS = `Path=/api/directorio; HttpOnly; Secure; SameSite=Lax`;

const sign = (payload: string) => hmac(`directory-session:${payload}`);

export function sessionCookie(email: string) {
  const exp = Date.now() + SESSION_HOURS * 3600_000;
  const payload = `${Buffer.from(email).toString('base64url')}.${exp}`;
  return `${SESSION_COOKIE}=${payload}.${sign(payload)}; Max-Age=${SESSION_HOURS * 3600}; ${COOKIE_ATTRS}`;
}

export const clearedCookie = `${SESSION_COOKIE}=; Max-Age=0; ${COOKIE_ATTRS}`;

/** The verified email behind the session cookie, or null. */
export function sessionEmail(req: Request): string | null {
  const raw = req.headers
    .get('cookie')
    ?.split(/;\s*/)
    .find((c) => c.startsWith(`${SESSION_COOKIE}=`))
    ?.slice(SESSION_COOKIE.length + 1);
  if (!raw) return null;
  const [b64, exp, sig] = raw.split('.');
  if (!b64 || !exp || !sig) return null;
  if (!sameHash(sig, sign(`${b64}.${exp}`)) || Number(exp) < Date.now()) return null;
  const email = Buffer.from(b64, 'base64url').toString();
  return EMAIL_RE.test(email) ? email : null;
}

// ---------- Resend ----------

export interface Mail {
  from: string;
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  text: string;
  html: string;
}

/** Sends one email; returns the Resend id, or null when it failed (logged). */
export async function sendMail(mail: Mail, idempotencyKey?: string): Promise<string | null> {
  if (!env.resendKey) {
    console.error('directory: RESEND_API_KEY is not set');
    return null;
  }
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.resendKey}`,
      'Content-Type': 'application/json',
      ...(idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : {}),
    },
    body: JSON.stringify(mail),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    console.error('resend failed', res.status, JSON.stringify(body));
    return null;
  }
  return (body.id as string) ?? 'sent';
}

export const escapeHtml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
