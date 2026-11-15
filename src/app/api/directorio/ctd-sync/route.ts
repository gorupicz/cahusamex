// GET /api/directorio/ctd-sync: pushes this directory to cancuntech.day/directorio (Vercel cron,
// every 10 minutes; see vercel.json). One way: cancuntech.day never writes here.
//
// Published profiles travel with their public data, the email (so the person can claim the copy
// there and receive intros) and LinkedIn. Someone who left (claimed and unpublished, or
// connect_opt_out) travels only as the sha-256 of their email, so cancuntech.day can hide its copy
// without learning an email it didn't have. Drafts that were never published don't travel.
// Rules on the other side: cancuntech.day supabase/migrations/20261114220000_directory_cahusamex_sync.sql.
//
// ?dry=1 runs everything on cancuntech.day and rolls it back, returning the counts.
import { createHash } from 'node:crypto';
import { env, json, rest, type Row } from '@/lib/server/core';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const CTD_RPC = 'https://mmpdnezqnwcfjjguvdcw.supabase.co/rest/v1/rpc';
// cancuntech.day's publishable key: public by design. CTD_SYNC_TOKEN is what authorizes the push.
const CTD_KEY = 'sb_publishable_MxzeOQQYXeG4lD_5J1txiA_X5cfxMh9';
// cancuntech.day gives anon 3 s per statement: 250 profiles per call stay well under it.
const BATCH = 250;
const COLUMNS =
  'email,status,published,connect_opt_out,name,kind,company,job_title,headline,description,services,categories,city,website,linkedin_url,photo_path';

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

export async function GET(req: Request) {
  // Vercel sends the cron with Authorization: Bearer $CRON_SECRET.
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || req.headers.get('authorization') !== `Bearer ${cronSecret}`) {
    return json({ ok: false, reason: 'unauthorized' }, 401);
  }
  const token = process.env.CTD_SYNC_TOKEN;
  if (!token || !env.supabaseUrl || !env.serviceKey) return json({ ok: false, reason: 'unavailable' }, 503);
  const dryRun = new URL(req.url).searchParams.get('dry') === '1';

  try {
    const profiles: Row[] = [];
    for (let offset = 0; ; offset += 1000) {
      const page = await rest<Row[]>(`directory_profiles?select=${COLUMNS}&order=id.asc&limit=1000&offset=${offset}`);
      profiles.push(...page);
      if (page.length < 1000) break;
    }

    const photoBase = `${env.supabaseUrl}/storage/v1/object/public/directory-photos/`;
    const rows: Row[] = [];
    const seen: string[] = [];
    for (const p of profiles) {
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
          photo_url: p.photo_path ? photoBase + p.photo_path : null,
        });
      } else if (p.connect_opt_out || p.status === 'claimed') {
        rows.push({ email_sha256: hash, hidden: true });
      } else {
        continue; // a private draft: never published here, never sent
      }
      seen.push(hash);
    }

    const totals: Record<string, number> = {};
    for (let i = 0; i < rows.length; i += BATCH) {
      const res = await ctd('directory_cahusamex_sync', { p_token: token, p_rows: rows.slice(i, i + BATCH), p_dry_run: dryRun });
      for (const [k, v] of Object.entries(res)) if (typeof v === 'number') totals[k] = (totals[k] ?? 0) + v;
    }
    const finish = await ctd('directory_cahusamex_finish', { p_token: token, p_seen: seen, p_dry_run: dryRun });

    const result = { ok: true, dryRun, sent: rows.length, ...totals, finish };
    console.log('ctd sync', JSON.stringify(result));
    return json(result);
  } catch (err) {
    console.error('ctd sync failed', err);
    return json({ ok: false, reason: 'failed' }, 502);
  }
}
