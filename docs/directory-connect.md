# Directory (`/directorio`) and Connect (`/connect`)

Operating notes for the people and bots who run cahusa.mx: what the directory and Connect do, how they are built, how to answer members and how to check what is happening. Both are in Spanish only, like the rest of the site.

They are a port of the same features on Cancún Tech Day (`cancuntechday` repo, `docs/connect.md`). The rules are the same; the stack, the member pool, the sender and the Stripe account are Cahusamex's own.

## Decisions (owner, 2026-11-13)

| Question | Decision |
|---|---|
| Who is in the directory and the matching pool | Cahusamex's own pool: guests of Cahusamex events on Luma (imported from CSV exports) plus anyone who creates a profile at `/directorio/editar`. Not shared with Cancún Tech Day. |
| Backend | A new Supabase project for Cahusamex: `cahusamex` (`xfkicfgxznzvuffnufts`, `https://xfkicfgxznzvuffnufts.supabase.co`, us-east-1) in the organization **CAHUSAMEX - Cámara de la Hospitalidad USA - México** (`klokculkvkwxhbqtyumw`, Free plan), created 2026-11-14. |
| Plans and prices | Same as Cancún Tech Day (table below), in the **LA BOLSA MX - Club** Stripe account (`acct_1QEETiACwbCfcqfc`). |
| Intros | From Esteban Gorupicz, `goru@cahusa.mx`, sent with Resend. |
| Languages | Spanish only. |
| More sources (2026-11-14) | The subscribers of the Luma calendar **México Hospitalidad** (`cal-3KpS8bP7ptEMjBY`) and the users of **La Bolsa MX** (labolsa.mx), imported **already published**, like Crunchbase: the directory should show thousands of people from day one, and each person claims their profile later to complete it. Owner's explicit decision after being told the privacy risk. Event guests stay private drafts. See [Importing the pool](#importing-the-pool). |
| Cancún Tech Day (2026-11-14) | The two directories show each other's published profiles and follow each other's claims, edits and opt-outs, without loops. Same consent model as the imports: published before they claim, "Reclamar este perfil" and opt-out on both sides. Each Connect matching pool stays its own (copies are not matched, but get direct intros). See [Sync with cancuntech.day](#sync-with-cancuntechday). |

## What it is

**The directory.** Everyone in the community has a profile in `public.directory_profiles`:

- Imported Luma event guests land as **private, unclaimed** drafts. Luma calendar subscribers and La Bolsa MX users land **unclaimed but published** (only those with a name of their own); their public page says "¿Eres {nombre}? Reclamar este perfil".
- The list loads every published profile (paged 1,000 at a time from PostgREST) and sorts the fuller ones first: featured, claimed, then photo, headline, categories, services, company, job title, city. It shows 60 cards and "Ver más perfiles".
- A person signs in at `/directorio/editar` with their email and a 6-digit code, reviews the draft, completes it and may publish it. Anyone can create a profile there with any email.
- Published profiles are listed at `/directorio` (Business Plus first, with a "Destacado" badge) and have a page at `/directorio/<slug>`.
- Public profiles show no LinkedIn or WhatsApp. Contact goes through **Pedir intro**. Business and Business Plus members can opt in to show them.

**Connect.** A paid introductions service on top of the directory:

1. A member with a **saved (claimed) profile** writes their ideal customer profile (ICP).
2. Claude ranks everyone in the pool and returns **anonymous** matches, each with a one-line reason.
3. The member ticks people and presses **Pedir intro**. A dialog shows their plan, the paid plans and a read-only preview of the email, with the match's name and company masked.
4. On confirm, an intro email goes out **from Esteban Gorupicz (`goru@cahusa.mx`)** to each match, with the member in copy. That email is where the member first learns who the match is.

Until the intro goes out, a match shows no company, email, phone, LinkedIn or profile link. **Starter** members don't see the name either (a blurred stand-in). **Business and Business Plus** members see the name.

### Pages

| Path | What |
|---|---|
| `/directorio` | Published profiles with a search box and filters (category, type, city). Buttons to the editor and to Connect. |
| `/directorio/<slug>` | A public profile. **Pedir intro** opens `/connect?intro=<slug>`; website always; LinkedIn and WhatsApp only for paid members who opted in. Unclaimed profiles show **Reclamar este perfil** (to `/directorio/editar`). |
| `/directorio/editar` | Sign-in (email + code), the profile form, photo/logo upload, **Publicar en el directorio**, **Salir**. With `?next=/connect…` it shows **Continuar a Connect** after saving. |
| `/connect` | Sign-in, or "Primero crea tu perfil", or the tool: usage line, ICP box with the ICPs used, matches (25 per page, select all, sticky **Pedir intro**), the intro dialog with plans, the contact opt-in for paid plans, **Administrar suscripción**. |
| `/privacidad` | Privacy notice for the directory and Connect (linked from the footer, the editor and Connect). |

The header has a **Directorio** link (in `src/data/navigation.ts`, so the footer lists it too).

## Plans and limits

| Plan | Price | ICPs | Intros | Directory |
|---|---|---|---|---|
| Starter | Free | 1 | 3 in total **per organization** | Profile in the directory |
| Business | MXN 7,990 / month | 3 | Unlimited | Profile in the directory |
| Business Plus | MXN 9,590 / month | 5 | Unlimited | **Featured** profile + logo in the monthly newsletter |

Rules for every plan:

- **10 intros per day.** The day resets at midnight in Cancún (America/Cancun).
- **A pair is introduced only once,** in either direction.
- **The member needs a full name** (first name and surname, no initials) to send an intro (`incomplete_name`).
- **Intros come from the search on screen,** of the last 7 days; only people in it can be introduced.
- **A failed send doesn't count** and can be retried.
- **15 searches per member per day,** and 400 in total per day (a cost cap on Claude).
- **Free intros belong to the organization:** two profiles are the same organization when they share a corporate email domain (not Gmail, Outlook, etc.) or a company name (ignoring case, accents, punctuation and legal suffixes), one hop further.
- **ICPs:** an ICP is the text of a search (ignoring case and repeated spaces). Searching is free; an ICP is used up by its first intro and given back if every intro of that request failed. At the limit the box only takes the ICPs already used. No monthly reset; after a downgrade, used ICPs stay usable.
- **Direct intros** (from a profile's **Pedir intro**) follow the same limits but use no ICP. **"Mejor buscar perfiles similares"** fills the ICP box from that profile; nothing runs on its own.

**The database enforces all of this** (`connect_reserve_intros` and `connect_reserve_direct_intro` lock the member's row; advisory locks per domain and company protect the last free intro). The numbers also live in `src/lib/connect/plans.ts` for display: change both together.

The Business Plus newsletter logo is **manual**: nothing in the code does it.

## The intro email

```
Subject: Intro: {Member name} – {Match company, or match name}
From:    Esteban Gorupicz <goru@cahusa.mx>
To:      the match
Cc:      the member
Bcc:     goru@cahusa.mx

Hola {match first name},          (a company profile: "Hola equipo de {company name},")

Gracias por registrarte a {the match's most recent event}.
  (no event, e.g. a profile created on the site: "Te escribo porque formas parte de la comunidad de CAHUSA MX, la Cámara Empresarial de la Hospitalidad USA - México.")

Te quiero presentar a {Member name} (en copia) {pitch}. Me pareció que te podría interesar.

Si les queda bien, pueden coordinar una llamada.

Saludos,
Esteban

--
Esteban Gorupicz
(415) 805-2247
```

- **The `{pitch}`** is a "que …" clause Claude writes from the member's own profile during their search. Without one it falls back to ", {job title} en {company}".
- **The event name** comes from `directory_events.name` (set by the import script), the most recent by `starts_on`.
- The text, sender and signature live in `src/lib/server/connect.ts` (`buildIntro`, `INTRO_FROM`, `SIGNATURE`, `COMMUNITY_LINE`). `CONNECT_INTRO_FROM` and `CONNECT_INTRO_BCC` override the sender.

## How it is built

```
browser ── /directorio, /directorio/[slug]   (server components, anon key: RLS + column grants decide what shows)
   │
   ├─ /directorio/editar, /connect           (client components)
   │     └─ /api/directorio/{request-code, verify-code, logout, profile, photo}
   │     └─ /api/directorio/connect/{status, search, preview, intros, direct, direct-intro, contact, checkout, portal}
   │            Next.js route handlers on Vercel (Node), service role
   │              ├─ Supabase Postgres (PostgREST) and Storage (bucket directory-photos)
   │              ├─ Claude API (matching)
   │              ├─ Resend (codes from directorio@cahusa.mx, intros from goru@cahusa.mx)
   │              └─ Stripe API (Checkout, billing portal)
   │
Stripe ── POST https://www.cahusa.mx/api/directorio/connect/stripe-webhook
```

Differences from Cancún Tech Day:

- **No Edge Functions and no proxy:** the API is Next.js route handlers in this repo.
- **The session cookie** (`cahusa_directory`, `Path=/api/directorio`, 2 hours, HttpOnly) is signed with `DIRECTORY_SESSION_SECRET`, not with the service role key. The same secret signs the codes, the IP hashes and the match tokens.
- **Writes are same-origin only** (checked on every non-GET route except the webhook).
- **Company size** is a column on `directory_profiles` set by the import, not a view over Luma registrations. Ranges: 1-10, 11-50, 51-200, 201-1000, 1000+.
- **`connect_opt_out`:** a column to stop suggesting and introducing someone. It is excluded from matches and intros.
- **Categories** are hospitality-specific (renta vacacional, hotelería, administración de propiedades…). The keys live in the migration's check constraint and in `src/lib/directory/config.ts`.

### Files

| Path | What |
|---|---|
| `supabase/migrations/20261113120000_directory_connect.sql` | All tables, RLS, column grants, the photo bucket, the import function and the Connect limit functions |
| `supabase/tests/*`, `scripts/test-migrations.sh` | The migration applied to a throwaway local Postgres, with tests of every limit and of what anon can read |
| `scripts/import-luma-directory.mjs` | CSV (Luma guests, Luma calendar people, La Bolsa MX users) → `directory_events` + `directory_profiles` (dry run by default) |
| `supabase/migrations/20261114120000_directory_import_publish.sql` | A published profile needs a slug, not a claim; the import can publish (`"publish": true` per row); `status` readable by anon (for "Reclamar este perfil") |
| `src/lib/directory/config.ts` | Categories, sizes, paths, shared types |
| `src/lib/connect/plans.ts` | Plans, prices shown, limits for display |
| `src/lib/server/core.ts` | Env, Supabase REST, the session cookie, Resend |
| `src/lib/server/directory.ts` | Sign-in and the profile editor API |
| `src/lib/server/connect.ts` | Connect API: matching, anonymity, intros, Stripe |
| `src/lib/server/public.ts` | Anon reads for the public pages |
| `src/app/api/directorio/[action]/route.ts`, `src/app/api/directorio/connect/[action]/route.ts` | Route handlers |
| `src/app/directorio/**`, `src/app/connect/page.tsx`, `src/app/privacidad/page.tsx` | Pages |
| `src/components/directory/*`, `src/components/connect/ConnectApp.tsx` | Client components |

### Connect routes

All routes except the webhook need the session cookie. They answer `{ ok: false, reason }` on errors. `match_id` and `match_ids` are opaque tokens (an HMAC of member and profile), never profile ids; `search_id` is the search on screen.

| Route | Does |
|---|---|
| `GET status` | Profile (null if not claimed), plan, usage `{today, dailyLimit, freeUsed, freeLimit, icps, icpLimit}`, billing on/off, the last search |
| `POST search {icp}` | Refuses a new ICP at the limit before calling Claude, ranks, stores the search, returns anonymous matches |
| `POST preview {match_id}` | The intro with `[nombre]` and `[empresa]` masked |
| `POST intros {search_id, match_ids}` | Reserves within the limits and sends; returns `{sent, failed, skipped, usage}` as tokens |
| `POST direct {slug}` / `POST direct-intro {slug}` | A published profile to introduce directly, and the send |
| `POST contact {show}` | Business / Business Plus only: show LinkedIn and WhatsApp |
| `POST checkout {plan}` / `POST portal` | Stripe Checkout / billing portal URL |
| `POST stripe-webhook` | Stripe only; signature checked |

### Matching

- **Two steps:** `claude-opus-5-5` at low effort with structured output and the server-side refusal fallback returns the index and score of everyone who fits (at most 100) plus the pitch; `claude-haiku-5-5` (thinking off) writes each match's anonymous label and reason in parallel batches of 10. A failed batch leaves its matches with the leak-checked job title.
- **What Claude sees:** one line per candidate with company size, role, company, headline, categories, services and 200 characters of the description. No names, emails or links. The list is ordered by id and cached for 1 hour, so a search mostly pays for the ICP and the answer. Usage is logged as `connect search usage`.
- **Leak filter:** labels and reasons that name the person or a distinctive word of their company are replaced (label → job title → generic line) or dropped (reason).
- **The blurred name** Starter members see is filler built from the token (`hiddenName`), never the real name.
- **Prompt injection:** the prompts tell Claude to treat the ICP and every profile field as data.

### Data (Supabase project `xfkicfgxznzvuffnufts`)

| Table / column | What |
|---|---|
| `directory_profiles` | Profiles. Public columns: id, slug, name, kind, company, job_title, headline, description, services, categories, city, website, photo_path, featured, status, updated_at. Private: email, linkedin_url, whatsapp, company_size, source_events, published, plan, show_contact, connect_opt_out. |
| `directory_profiles.plan` | `starter` / `business` / `business_plus`. Set only from Stripe (`connect_apply_plan`). `featured` is generated from it. |
| `directory_events` | `slug`, `name` (as the intro says it), `starts_on` |
| `directory_email_codes` | Sign-in codes (HMAC), attempts, expiry |
| `connect_searches` | `requester_id`, `icp`, `pitch`, `results` (`[{id, score, label, reason}]`) |
| `connect_icps` | One row per member and ICP used |
| `connect_intros` | `requester_id`, `match_id`, `plan` at send time, `icp_id`, `status`, `resend_id`, `sent_at`. Unique per pair. |
| `connect_subscriptions` | One row per Stripe subscription |

Only `directory_profiles` (published rows, public columns) and `directory_public_contact(slug)` are readable with the anon key; everything else is service role only.

## Billing (Stripe)

- **Account: LA BOLSA MX - Club** (`acct_1QEETiACwbCfcqfc`, live; owner's decision, 2026-11-13). Not Latinx Familia, which bills Cancún Tech Day, nor the SaaS or Commissions accounts.
- Products and prices, created in live on 2026-11-13 (metadata `program=connect`, `site=cahusa.mx`, `plan`):

  | Plan | Product | Monthly price (MXN) | Lookup key |
  |---|---|---|---|
  | Business | `prod_VcdzaE4aB0ZULV` | `price_1UbOhRACwbCfcqfcNwtl2b7j` (7,990) | `cahusamex_connect_business_monthly` |
  | Business Plus | `prod_VcdzMA1bJ1RPOL` | `price_1UbOhUACwbCfcqfcjcIpx34l` (9,590) | `cahusamex_connect_business_plus_monthly` |

  The price ids go in `STRIPE_PRICE_BUSINESS` and `STRIPE_PRICE_BUSINESS_PLUS`; there are no defaults in the code.
- Webhook destination `https://www.cahusa.mx/api/directorio/connect/stripe-webhook` with `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`.
- Checkout has `allow_promotion_codes` on, so discount codes created in Stripe work without code changes.
- Without the Stripe env vars the plans still show and **Suscribirme** answers "Las suscripciones todavía no están disponibles".
- Flow: Checkout with the profile id in the metadata → webhook upserts `connect_subscriptions` → `connect_apply_plan`. The plan follows the best live subscription (`active`, `trialing`, `past_due`); when it ends the member drops to Starter.

## Environment variables (Vercel, project `labolsamx/cahusamex`)

**Loaded on 2026-11-14** for Production and all Preview branches: `SUPABASE_URL`, `SUPABASE_ANON_KEY` (the project's *publishable* key, `sb_publishable_…`), `SUPABASE_SERVICE_ROLE_KEY` (its *secret* key, `sb_secret_…`, sensitive), `DIRECTORY_SESSION_SECRET` (generated, sensitive; Production and Preview have different values), `STRIPE_PRICE_BUSINESS`, `STRIPE_PRICE_BUSINESS_PLUS`, `STRIPE_PORTAL_CONFIGURATION`. `RESEND_API_KEY` (sending-only, `cahusa.mx`) and `ANTHROPIC_API_KEY` (key `cahusamex-connect`, Claude Console org *Esteban's Individual Org*, Default workspace, no expiry, linked to Esteban like `cancuntech-connect`) were added the same day, and so was `STRIPE_SECRET_KEY`: the restricted key `cahusamex-connect-vercel` in LA BOLSA MX - Club (write: Checkout Sessions, Customer Portal; read: Subscriptions, Customers, Prices, Products; nothing else). `STRIPE_WEBHOOK_SECRET` followed after the deploy, with the webhook. All variables are set. The Supabase keys are the new publishable/secret keys, not the legacy JWT `anon`/`service_role` keys (retired in 2027); the code sends them as `apikey` and `Authorization: Bearer`, which the Supabase gateway accepts.

| Variable | Used for | Required |
|---|---|---|
| `SUPABASE_URL` | Both | Yes |
| `SUPABASE_ANON_KEY` | Public pages | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | API | Yes (secret) |
| `DIRECTORY_SESSION_SECRET` | Session cookie, codes, tokens. At least 32 characters (`openssl rand -hex 32`). Changing it signs everyone out and changes match tokens. | Yes (secret) |
| `RESEND_API_KEY` | Codes and intros (domain `cahusa.mx` verified in Resend) | Yes (secret) |
| `ANTHROPIC_API_KEY` | Matching | For Connect search (secret) |
| `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` | Billing | For paid plans (secret) |
| `STRIPE_PRICE_BUSINESS`, `STRIPE_PRICE_BUSINESS_PLUS` | Billing | For paid plans |
| `STRIPE_PORTAL_CONFIGURATION` | The Connect billing portal configuration (`bpc_…`). Without it Stripe uses the account's default portal, which the Club account doesn't have yet. | For **Administrar suscripción** |
| `SITE_URL` | Stripe return URLs (default `https://cahusa.mx`) | No |
| `DIRECTORY_MAIL_FROM` | Code sender (default `CAHUSA MX <directorio@cahusa.mx>`) | No |
| `CONNECT_INTRO_FROM`, `CONNECT_INTRO_BCC` | Intro sender (default `Esteban Gorupicz <goru@cahusa.mx>`) | No |
| `CRON_SECRET` | Vercel sends it to the cron (`/api/directorio/ctd-sync`) | For the cancuntech.day sync (secret) |
| `CTD_SYNC_TOKEN` | Pushes our profiles to cancuntech.day (it keeps the sha-256, source `cahusamex`) | For the sync (secret) |
| `CTD_EXPORT_TOKEN` | Reads cancuntech.day's profiles (it keeps the sha-256, source `cahusamex-export`). Without it the cron only pushes. | For the sync (secret) |

Without the Supabase variables or the session secret every API route answers `unavailable` and the directory shows "No pudimos cargar el directorio".

## Deploy steps (in order)

Nothing below has been done yet. Each production step needs the owner's OK.

1. **Supabase:** ~~create the Cahusamex project~~ done 2026-11-14 (`xfkicfgxznzvuffnufts`, us-east-1, org CAHUSAMEX on the **Free plan**: Supabase pauses Free projects after a week without activity, so upgrade the organization to Pro before launch). ~~Apply the migration~~ applied 2026-11-14 through the dashboard SQL Editor (the file at commit `2c4d1c0`, SHA-256 checked), then verified: 7 tables with RLS, 16 functions, the `directory-photos` bucket, anon limited to the public columns and `directory_public_contact`, service role with full access. Because it went through the SQL Editor, it is not in `supabase_migrations.schema_migrations`: if the Supabase CLI is ever linked to this project, mark it applied with `supabase migration repair --status applied 20261113120000` before `db push`.
2. **Resend:** ~~add `cahusa.mx`~~ done 2026-11-14 in the Resend team **cahusa** (domain `0be35ca7-a069-4fc4-8b49-940a70dd8d8a`, us-east-1, return-path `send`), with its records added in Cloudflare (DNS only): TXT `resend._domainkey` (DKIM), CNAME `send` → `send.forge.rmta.net`, CNAME `rsend` → `rsend.forge.rmta.net`. The receiving MX (`@` → `receive.forge.rmta.net`) was deliberately **not** added: it would replace Cloudflare Email Routing, which forwards `goru@cahusa.mx`. The domain was **verified** the same day. A sending-only API key restricted to `cahusa.mx` (`cahusamex-vercel-directorio-connect`) is in `RESEND_API_KEY` for Production and Preview.
3. **Anthropic:** ~~create an API key~~ done 2026-11-14: `cahusamex-connect` (no expiry, Default workspace), loaded as `ANTHROPIC_API_KEY`. Its cost shows apart from `cancuntech-connect` in the Console.
4. **Stripe (LA BOLSA MX - Club):** ~~create the two products and monthly MXN prices~~ (done 2026-11-13, ids above). ~~Billing portal configuration~~ done 2026-11-14: `bpc_1Ubl2FACwbCfcqfcBOoC8HgI` (switch between the two Connect prices with proration, cancel at period end with a reason, invoice history, payment method, email/name/tax id/address), set in `STRIPE_PORTAL_CONFIGURATION`. Being the account's first portal configuration, Stripe made it the **default** for LA BOLSA MX - Club: any other portal session in that account without its own configuration would show these options. ~~Webhook~~ done 2026-11-14 after the deploy: `we_1UbmN3ACwbCfcqfcGgBmXE9J` → `https://www.cahusa.mx/api/directorio/connect/stripe-webhook` (the `www` host: `cahusa.mx` answers 307 to `www`, and Stripe doesn't follow redirects), events `checkout.session.completed` and `customer.subscription.{created,updated,deleted}`, signing secret in `STRIPE_WEBHOOK_SECRET`. A replayed payment-mode checkout event got 200 (signature checked, ignored). The endpoint receives these events for the whole Club account (other products' checkouts too); the handler ignores anything that is not a Connect subscription. The account's other endpoint (`labolsa.mx`) is untouched.
5. **Vercel:** set the env vars above for Production (and Preview if wanted) on `labolsamx/cahusamex`. Also check the project's framework preset says Next.js (it still says Vite; `vercel.json` overrides it).
6. **Merge the PR** and let Vercel deploy.
7. **Import the pool:** see [Importing the pool](#importing-the-pool) (dry run first, then `--apply`).
8. **Smoke test in production:** sign in at `/directorio/editar`, publish a profile, search in `/connect`, send one intro to a test profile you own, run a Checkout with a 100% coupon and check the plan changes, open the portal.

## Sync with cancuntech.day

The published profiles of this directory appear in **cancuntech.day/directorio**, and theirs appear here (owner's requests, 2026-11-14). Both directions run from **one place**: `src/app/api/directorio/ctd-sync/route.ts`, a Vercel cron every 10 minutes (`vercel.json`), authenticated with `CRON_SECRET`. cancuntech.day runs nothing on a schedule and never writes to this database: it only answers two token-gated calls made with its publishable key.

**1. Push (here → cancuntech.day)**, with **`CTD_SYNC_TOKEN`**: reads every profile with the service role and calls cancuntech.day's `directory_cahusamex_sync` (250 rows per call) and `directory_cahusamex_finish`.
- **What travels:** published profiles without `connect_opt_out` (public fields, email, LinkedIn, photo URL of our own bucket); people who left (claimed and unpublished, or `connect_opt_out`) as the sha-256 of their email only; never private drafts or WhatsApp.
- **Never sent back:** an unclaimed copy of one of their profiles (`source_events` exactly `{cancuntechday}`). A profile unpublished here only because it left there (unclaimed, `ctd_status = 'hidden'`) is *held*: counted as seen, nothing else, so their opt-out doesn't bounce back to them as ours.
- **On cancuntech.day:** claimed or edited here → the copy follows (unless the person claimed it there, then theirs wins); unpublished, opted out or deleted here → the copy is unpublished. Categories map to cancuntech.day's (vacation rentals, hotels and tourism → Hotelería y turismo; property management → Bienes raíces; maintenance → Operaciones; technology → Software; construction and design → Otra). Rules: cancuntech.day `supabase/migrations/20261114220000_directory_cahusamex_sync.sql`, its `docs/connect.md` ("Profiles from cahusa.mx").

**2. Pull (cancuntech.day → here)**, with **`CTD_EXPORT_TOKEN`** (skipped while it is not set): pages through cancuntech.day's `directory_cahusamex_export` (500 per page; its migration `20261115120000_directory_cahusamex_export.sql`) and applies the rows here with `directory_ctd_sync` (500 per call) and `directory_ctd_finish`, service role only (`supabase/migrations/20261115120000_directory_ctd_sync.sql`).
- **What comes:** only their own profiles (claimed there, or with a source besides `cahusamex`): published ones with their public fields, email, LinkedIn and photo path; people who left there (claimed and unpublished, or `publish_opt_out`) as a sha-256; *held* ones (unpublished there only because they left here) as a sha-256 we ignore. Never their private drafts or WhatsApp, never a copy of ours.
- **`directory_profiles.ctd_status`** (private): `imported` (published there, unclaimed), `claimed` (published there by its owner), `hidden` (left there), null (not there as a profile of its own).
- **Precedence:** claimed **here** → the person owns this copy, cancuntech.day changes nothing. Claimed **there** → what they wrote there replaces this copy, and the Luma import no longer overwrites it. Imported there → only fills empty fields (and the name, when ours is only the email's local part).
- **New emails** become unclaimed, published profiles tagged `source_events` `cancuntechday` (only with a name of their own). **Leaving:** hidden there → unpublished here (unless claimed here) and the import won't publish it again; back there → published again; `connect_opt_out` here keeps it out. **Guard:** `finish` refuses to hide anyone when a run sees under half of the profiles synced before.
- **Photos** stay in cancuntech.day's public bucket: `photo_path` holds its URL (a check constraint allows only that bucket); `removePhoto` never deletes one. Categories map back (Hotelería → Hoteles; Software, IA y datos, Startups → Tecnología; Marketing → Marketing y ventas; Diseño, Educación, Operaciones → Otra).
- **Connect:** unclaimed cancuntech.day copies are not in the matching pool (theirs doesn't match ours either), but they get direct intros from their public profile; the intro says "Te escribo porque estás en el directorio de Cancún Tech Day (cancuntech.day)."

**Check a run:** `GET /api/directorio/ctd-sync?dry=1` with `Authorization: Bearer $CRON_SECRET` runs both directions and rolls them back, returning `push` and `pull` counts. Logs: Vercel → Functions → `ctd sync`. Last pull: `select * from directory_sync_state where source = 'ctd'`.

## Importing the pool

Three sources, all through `scripts/import-luma-directory.mjs` (dry run unless `--apply`; with the service role key in the env the dry run also says who is already in the directory). Keep every CSV and `--out` file **out of the repo**: they hold emails.

| Source | Event slug | `directory_events.name` (the intro says "Gracias por registrarte a …") | Date | Published |
|---|---|---|---|---|
| Luma event guests (Manage event → Guests → Download CSV) | one per event, e.g. `cena-cancun-2026` | the event's name | the event's date | No |
| Luma calendar **México Hospitalidad** people (Calendar → Personas → Descargar como CSV; Luma asks the owner to confirm with a passkey or an emailed code). Rows with `subscription_status = unsubscribed` are skipped. | `luma-mexico-hospitalidad` | `la comunidad México Hospitalidad` | `2026-11-14` (the export date, so a later dated event wins) | **Yes** (`--publish`) |
| **La Bolsa MX** users (read-only query below) | `labolsa-mx` | `La Bolsa MX` | `2025-04-22` (its first user) | **Yes** (`--publish`) |

**La Bolsa MX users** come from its production database (repo `acreditacion`, `.env.production.readonly`, role `analyst_readonly`, SELECT only; never write there): active users not deleted, minus everyone who opted out of marketing email (`whatsapp_system_state` kind `email_marketing_opt_out:<userId>`) and every address with a permanent bounce or spam complaint (`email_events`). Columns: `email`, `name` (profile full name), `company` (their non-personal organization, as owner first), `job_title` derived from activity: `Administrador de rentas vacacionales` (has a Guesty/PMS key or managed properties) or `Vendedor de rentas vacacionales` (accepted seller in `brokers`). La Bolsa MX has no city, LinkedIn or company size. The query used on 2026-11-14 is in the shared session notes (`labolsa-users.sql`); run it with `psql "$DIRECT_URL" -X -q -f labolsa-users.sql > labolsa-users.csv`.

**Always exclude** the owner's own and test addresses and La Bolsa MX's WhatsApp-only placeholders:

```bash
node scripts/import-luma-directory.mjs \
  --event luma-mexico-hospitalidad --name "la comunidad México Hospitalidad" --date 2026-11-14 --publish --csv luma-members.csv \
  --event labolsa-mx --name "La Bolsa MX" --date 2025-04-22 --publish --csv labolsa-users.csv \
  --exclude-pattern '^goru[+@]' --exclude-pattern '@g14t' --exclude-pattern '\.local$' --exclude-pattern '@(test\.com|example\.com)$' \
  [--apply]
```

Re-running is safe: emails are the key, claimed profiles only gain `source_events`, the import never unpublishes anyone and never publishes a claimed profile. Someone who asks to be removed: unpublish them (`published = false`) and set `connect_opt_out = true`; **a later re-run with `--publish` would publish an unclaimed profile again**, so add them to `--exclude` too (or delete the row, with Esteban's OK).

**Photos** (`scripts/import-directory-photos.mjs`, after the people are imported; dry run unless `--apply`, needs the service role key for both). It takes CSVs of `email,photo_url`, the first file winning for an email, and only touches **unclaimed profiles without a photo**. Each image is checked for placeholders (Google's white initial on a flat colour, its grey "no photo" and blue silhouette icons, blank squares: two colours covering 90% of a 48×48 thumbnail, or white marks on a flat background; a few two-colour logos are lost with them), cropped to 400×400 WebP without metadata and uploaded to `directory-photos/<profile id>/<uuid>.webp`. Sources used on 2026-11-14:

- **Luma calendar avatars:** `user.avatar_url` from `https://api.luma.com/calendar/admin/get-members?calendar_api_id=cal-3KpS8bP7ptEMjBY` (run in the browser while signed in to Luma as an admin, paginated with `pagination_cursor`), skipping `avatars-default`. Matched to emails through the CSV's `user_id`. Only 77 of 2,304 had a real photo.
- **La Bolsa MX Google avatars:** `profiles."socialAvatarUrl"` (public `lh3.googleusercontent.com` URLs; the script asks for the 400 px size). Photos La Bolsa MX users uploaded themselves (`profiles."profilePictureUrl"`, private bucket `user-profile-pictures`) need La Bolsa MX's service key to sign: the owner ran the signing in their own terminal (2-hour signed URLs), and they were imported the same day. Where the earlier Luma/Google photo was the same picture, it was kept; 23 profiles had it replaced by their own upload. Nine company logos the placeholder filter dropped were imported by hand.

```bash
node scripts/import-directory-photos.mjs --csv luma-photos.csv --csv labolsa-google-photos.csv [--apply]
```

**Luma bio and LinkedIn** (2026-11-14, owner's request): from the same `get-members` API, `user.bio_short` (at most 140 characters) went to `headline` and `user.linkedin_handle` to `linkedin_url` (`https://www.linkedin.com/` + handle, `in/…` or `company/…`), only on **unclaimed profiles where the field was empty**. Bios that were not about the person (survey answers, "Gracias", "...") and fake handles ("None", "Nope", a bare first name) were left out by hand: 81 bios and 78 LinkedIn URLs. `linkedin_url` is not a public column: the public page shows it only for paying Connect members who opted in (`directory_public_contact`); it is there for Connect and for the person when they claim the profile.

Counts per source after an import:

```sql
select e as source, count(*) as profiles, count(*) filter (where published) as published,
       count(*) filter (where status = 'claimed') as claimed
  from directory_profiles, unnest(source_events) e group by 1 order by 1;
```

## Answering members

Reply in Spanish (es-MX, "tú").

- **"¿Cómo funciona?"** Describe tu cliente ideal en cahusa.mx/connect, te mostramos a las personas de la comunidad que encajan, eliges a quiénes quieres conocer y Esteban te presenta por correo, contigo en copia.
- **"No puedo entrar / me pide crear perfil."** Necesitas un perfil guardado en el directorio. Desde Connect te lleva a crearlo, y al guardar aparece "Continuar a Connect".
- **"¿Quiénes son los matches? No veo nombres."** En el plan Starter, los nombres y empresas se revelan en el correo de la intro. Con Business o Business Plus ves el nombre de cada match; la empresa se revela en el correo.
- **"¿Por qué no veo el WhatsApp o el LinkedIn de alguien?"** Para cuidar a la comunidad, el contacto es por intro: en su perfil presiona "Pedir intro". Los miembros con plan de pago pueden elegir mostrar su contacto.
- **"¿Cómo cierro sesión?"** En "Perfil" (arriba en Connect), "Salir" está abajo a la izquierda del formulario.
- **"¿Puedo escribir yo el correo?"** No: el texto es fijo y se adapta a cada persona; lo ves completo antes de enviarlo.
- **"¿Me pasas el correo/WhatsApp de X?"** No compartimos datos de contacto; la forma de conectar es pedir la intro.
- **"No puedo escribir otro ICP."** Cada plan incluye un número de ICP: Starter 1, Business 3, Business Plus 5. Un ICP se usa cuando envías la primera intro de esa búsqueda.
- **"Se me acabaron las intros."** Starter incluye 3 por organización (mismo dominio de correo o misma empresa). Business y Business Plus son ilimitadas, con un máximo de 10 al día.
- **"Ya pagué y sigo en Starter."** Normalmente se activa en segundos. Revisa `connect_subscriptions` y los logs de Vercel (`connect webhook`); si no hay fila, escala a Esteban.
- **"Quiero cancelar."** Connect → "Administrar suscripción".
- **"No quiero recibir intros / que no me sugieran."** Set `connect_opt_out = true` on their profile (`update directory_profiles set connect_opt_out = true where email = '…'`), with Esteban's OK.

## Useful queries

```sql
-- Intros sent today (Cancún day) and by whom
select p.name, p.email, count(*) as intros
  from connect_intros i join directory_profiles p on p.id = i.requester_id
 where i.status = 'sent' and i.created_at >= connect_day_start()
 group by 1, 2 order by 3 desc;

-- Paid members (Business Plus = featured + newsletter logo)
select p.name, p.company, p.plan, s.status, s.current_period_end
  from directory_profiles p left join connect_subscriptions s on s.profile_id = p.id
 where p.plan <> 'starter' order by p.plan desc, p.name;

-- Starter members whose organization used all 3 free intros (upsell list)
select p.name, p.email, p.company, connect_free_used(p.id) as org_used
  from directory_profiles p
 where p.plan = 'starter' and p.status = 'claimed' and connect_free_used(p.id) >= 3
 order by p.company, p.name;

-- Pool size and how much of it can be matched
select count(*) as profiles,
       count(*) filter (where job_title is not null or company is not null or headline is not null or description is not null) as matchable,
       count(*) filter (where status = 'claimed') as claimed,
       count(*) filter (where published) as published
  from directory_profiles where not connect_opt_out;

-- cancuntech.day sync: last pull, and profiles by status
select last_sync_at, last_result from directory_sync_state where source = 'ctd';
select ctd_status, count(*), count(*) filter (where published) as published,
       count(*) filter (where source_events = '{cancuntechday}') as only_from_ctd
  from directory_profiles where ctd_status is not null group by 1;
```

Logs: Vercel → project `cahusamex` → Logs. Search for `connect search usage`, `resend failed`, `connect webhook` and `connect api failed`.

## Guardrails

- **Never send intros on a member's behalf.** Only the member, through the page, sends them.
- **Never change `directory_profiles.plan` by hand.** It follows Stripe. To give a plan for free, create a 100% coupon and let them subscribe, with Esteban's OK.
- **Never tell a member who a match is before the intro goes out** beyond what the page shows.
- **Ask Esteban before** changing prices, plans, the intro template or the limits (they live in the SQL functions and in `src/lib/connect/plans.ts`).
- **Ship changes through a PR to `main`.** Migrations are applied to the Supabase project by hand, after testing them with `scripts/test-migrations.sh`.

## Known gaps

- **Not tested end to end:** no Supabase project, Resend domain, Anthropic key or Stripe account exists for Cahusamex yet. The SQL (limits, grants, import) is tested on a local Postgres; the pages build and render; the API was checked only for its unconfigured answers.
- **Newsletter logo** for Business Plus is manual, and it is not confirmed that Cahusamex sends a monthly newsletter.
- **Privacy notice** was adapted from Cancún Tech Day's without a lawyer's review; requests go to `goru@cahusa.mx`.
- **Opt-out** is a column set by hand; there is no self-service switch.
- **Luma calendar subscribers and La Bolsa MX users are published without their consent** (owner's decision, 2026-11-14). The privacy notice says so, but it was not reviewed by a lawyer, and La Bolsa MX's own notice was not checked for sharing data with CAHUSA MX. Most of those profiles show only a name (and, for La Bolsa MX, an activity line) until claimed.
- **The directory page** sends every listed profile to the browser (~3,000 short rows, no descriptions). Past ~10,000 it should move to server-side search and paging.
