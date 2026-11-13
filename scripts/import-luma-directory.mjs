#!/usr/bin/env node
// Loads the guests of Cahusamex events on Luma into public.directory_profiles (cahusa.mx/directorio
// and the Connect matching pool), from Luma guest exports (Manage event > Guests > Download CSV).
//
//   SUPABASE_URL=https://<ref>.supabase.co SUPABASE_SERVICE_ROLE_KEY=... \
//     node scripts/import-luma-directory.mjs \
//       --event <slug> --name "<event name for the intro email>" [--date YYYY-MM-DD] --csv <file.csv> \
//       [--event ... --name ... --csv ...] [--out rows.json] [--apply]
//
// Each --event starts a block; the --name, --date and --csv after it belong to that event. <slug>
// is lowercase words joined by dashes (e.g. cena-cancun-2026); --name is how the intro email names
// it ("Gracias por registrarte a <name>."); --date lets the intro pick the most recent event.
//
// Without --apply it is a dry run: it reads, merges and prints counts, and writes nothing.
// With --apply it upserts the events into directory_events and sends the people to
// directory_import_profiles(), which upserts on the email: running it twice changes nothing,
// unclaimed profiles take the fresh data, claimed ones only gain source events. Imported profiles
// are never published.
//
// --out writes the merged rows (emails included) to a local JSON file for review; keep it out of
// the repo.

import { readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';

const SUPABASE_URL = process.env.SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Guests who never registered ("Invited") or cancelled are not part of the directory.
const SKIP_STATUS = new Set(['invited', 'notgoing', 'declined', 'rejected', 'cancelled', 'canceled']);
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const SLUG_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const BATCH = 500;

// ---------- args ----------

function die(msg) {
  console.error(`import-luma-directory: ${msg}`);
  process.exit(1);
}

function parseArgs(argv) {
  const args = { events: [], apply: false, out: null };
  let current = null;
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const value = () => argv[++i] ?? die(`${a} needs a value`);
    if (a === '--event') {
      current = { slug: value(), name: null, date: null, csv: [] };
      if (!SLUG_RE.test(current.slug) || current.slug.length > 80) die(`bad event slug: ${current.slug}`);
      args.events.push(current);
    } else if (a === '--name' || a === '--date' || a === '--csv') {
      if (!current) die(`${a} must come after --event`);
      const v = value();
      if (a === '--name') current.name = v;
      else if (a === '--date') {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) die(`--date expects YYYY-MM-DD, got ${v}`);
        current.date = v;
      } else current.csv.push(v.replace(/^~(?=\/)/, homedir()));
    } else if (a === '--apply') args.apply = true;
    else if (a === '--out') args.out = value();
    else if (a === '--help' || a === '-h') {
      console.log(readFileSync(new URL(import.meta.url)).toString().split('\n').filter((l) => l.startsWith('//')).map((l) => l.slice(3)).join('\n'));
      process.exit(0);
    } else die(`unknown argument: ${a}`);
  }
  if (!args.events.length) die('nothing to import: pass --event <slug> --name "<name>" --csv <file>');
  for (const e of args.events) {
    if (!e.name) die(`event ${e.slug} needs --name`);
    if (!e.csv.length) die(`event ${e.slug} needs at least one --csv`);
  }
  if (args.apply && (!SUPABASE_URL || !KEY)) die('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required for --apply');
  return args;
}

// ---------- normalization ----------

export const normEmail = (v) => String(v ?? '').trim().toLowerCase();
const clean = (v) => {
  const s = String(v ?? '').replace(/\s+/g, ' ').trim();
  return s && !/^(n\/?a|na|none|-|\.|ninguna?|no)$/i.test(s) ? s : null;
};
const statusKey = (v) => String(v ?? '').toLowerCase().replace(/[^a-z]/g, '');

export function normLinkedin(v) {
  let s = clean(v);
  if (!s || !/linkedin\.com\//i.test(s)) return null;
  s = s.replace(/^(https?:\/\/)?/i, 'https://').replace(/[?#].*$/, '').replace(/\/+$/, '');
  try {
    const url = new URL(s);
    if (!/(^|\.)linkedin\.com$/i.test(url.hostname) || url.pathname.length < 2) return null;
    return `https://${url.hostname.toLowerCase()}${url.pathname}`.slice(0, 300);
  } catch {
    return null;
  }
}

/** A company size answer ("11 a 50", "51-200 empleados", "Más de 1000") to the ranges the database keeps. */
export function normSize(v) {
  const s = clean(v);
  if (!s) return null;
  const nums = (s.replace(/[.,](?=\d{3}\b)/g, '').match(/\d+/g) ?? []).map(Number);
  if (!nums.length) return /solo|just me|freelance|independiente/i.test(s) ? '1-10' : null;
  const n = /m[aá]s de|more than|\+/i.test(s) ? Math.max(...nums) + 1 : Math.max(...nums);
  if (n <= 10) return '1-10';
  if (n <= 50) return '11-50';
  if (n <= 200) return '51-200';
  if (n <= 1000) return '201-1000';
  return '1000+';
}

// ---------- CSV ----------

export function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = '';
  let quoted = false;
  text = text.replace(/^﻿/, '');
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') {
        field += '"';
        i++;
      } else if (c === '"') quoted = false;
      else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ',') {
      row.push(field);
      field = '';
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(field);
      field = '';
      if (row.some((f) => f !== '')) rows.push(row);
      row = [];
    } else field += c;
  }
  row.push(field);
  if (row.some((f) => f !== '')) rows.push(row);
  const [header = [], ...body] = rows;
  return body.map((r) => Object.fromEntries(header.map((h, i) => [h.trim(), r[i] ?? ''])));
}

/** The first column whose header matches, in pattern order (Luma custom questions have free-form headers). */
const pick = (row, patterns, exclude = /$^/) => {
  for (const re of patterns) {
    for (const [k, v] of Object.entries(row)) {
      if (re.test(k) && !exclude.test(k) && clean(v)) return clean(v);
    }
  }
  return null;
};

export function rowsFromCsv(text, event) {
  return parseCsv(text)
    .filter((r) => !SKIP_STATUS.has(statusKey(r.approval_status ?? r.status)))
    .map((r) => ({
      email: normEmail(r.email ?? r.Email),
      event,
      name: clean(r.name) ?? clean([r.first_name, r.last_name].filter(Boolean).join(' ')),
      company: pick(
        r,
        [/^company$/i, /company|empresa|compa[ñn][ií]a|organi[sz]a(tion|ci[oó]n)|negocio|business/i],
        /size|tama[ñn]o|emplead|employee|domain|dominio|website|sitio/i,
      ),
      job_title: pick(r, [/^(job_?title|title)$/i, /job title|cargo|puesto|position|role|\brol\b|ocupaci[oó]n/i], /ticket/i),
      linkedin_url: normLinkedin(pick(r, [/linkedin/i])),
      city: pick(r, [/^(city|ciudad)$/i, /\b(city|ciudad)\b/i]),
      company_size: normSize(pick(r, [/company size|tama[ñn]o|emplead|employees/i])),
    }))
    .filter((r) => EMAIL_RE.test(r.email));
}

/** One row per email; the first event given on the command line wins when two sources disagree. */
export function merge(rows, order) {
  const sorted = [...rows].sort((a, b) => order.indexOf(a.event) - order.indexOf(b.event));
  const byEmail = new Map();
  for (const r of sorted) {
    const m = byEmail.get(r.email) ?? {
      email: r.email,
      name: null,
      company: null,
      job_title: null,
      linkedin_url: null,
      city: null,
      company_size: null,
      source_events: [],
    };
    for (const k of ['name', 'company', 'job_title', 'linkedin_url', 'city', 'company_size']) m[k] ??= r[k] ?? null;
    if (!m.source_events.includes(r.event)) m.source_events.push(r.event);
    byEmail.set(r.email, m);
  }
  return [...byEmail.values()].map((m) => ({ ...m, source_events: m.source_events.sort() }));
}

// ---------- Supabase ----------

async function rest(path, init = {}) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...init,
    headers: { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json', ...init.headers },
  });
  if (!res.ok) die(`${init.method ?? 'GET'} ${path.split('?')[0]} failed: ${res.status} ${await res.text()}`);
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

// ---------- main ----------

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const all = [];
  for (const e of args.events) {
    for (const file of e.csv) {
      const rows = rowsFromCsv(readFileSync(file, 'utf8'), e.slug);
      console.log(`csv ${e.slug}: ${rows.length} guests from ${file}`);
      all.push(...rows);
    }
  }

  const merged = merge(all, args.events.map((e) => e.slug));
  const perEvent = Object.fromEntries(args.events.map((e) => [e.slug, merged.filter((m) => m.source_events.includes(e.slug)).length]));
  console.log(`merged: ${merged.length} people`, perEvent);
  console.log(
    `fields: company ${merged.filter((m) => m.company).length}, job title ${merged.filter((m) => m.job_title).length}, ` +
      `LinkedIn ${merged.filter((m) => m.linkedin_url).length}, city ${merged.filter((m) => m.city).length}, ` +
      `company size ${merged.filter((m) => m.company_size).length}`,
  );

  if (args.out) {
    writeFileSync(args.out, JSON.stringify(merged, null, 2));
    console.log(`wrote ${args.out} (contains emails; do not commit it)`);
  }
  if (!args.apply) {
    console.log('dry run: nothing written. Add --apply to upsert into directory_events and directory_profiles.');
    return;
  }

  await rest('directory_events', {
    method: 'POST',
    headers: { Prefer: 'resolution=merge-duplicates' },
    body: JSON.stringify(args.events.map((e) => ({ slug: e.slug, name: e.name, starts_on: e.date }))),
  });
  const totals = { inserted: 0, updated: 0, unchanged: 0 };
  for (let i = 0; i < merged.length; i += BATCH) {
    const [res] = await rest('rpc/directory_import_profiles', { method: 'POST', body: JSON.stringify({ p_rows: merged.slice(i, i + BATCH) }) });
    for (const k of Object.keys(totals)) totals[k] += res[k];
  }
  console.log('applied:', totals);
}

if (import.meta.url === `file://${process.argv[1]}`) main();
