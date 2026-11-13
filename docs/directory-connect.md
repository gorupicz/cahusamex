# Directory (`/directorio`) and Connect (`/connect`)

Operating notes for the people and bots who run cahusa.mx: what the directory and Connect do, how they are built, how to answer members and how to check what is happening. Both are in Spanish only, like the rest of the site.

They are a port of the same features on Cancún Tech Day (`cancuntechday` repo, `docs/connect.md`). The rules are the same; the stack, the member pool, the sender and the Stripe account are Cahusamex's own.

## Decisions (owner, 2026-11-13)

| Question | Decision |
|---|---|
| Who is in the directory and the matching pool | Cahusamex's own pool: guests of Cahusamex events on Luma (imported from CSV exports) plus anyone who creates a profile at `/directorio/editar`. Not shared with Cancún Tech Day. |
| Backend | A new Supabase project for Cahusamex. |
| Plans and prices | Same as Cancún Tech Day (table below), in the **LA BOLSA MX - Club** Stripe account (`acct_1QEETiACwbCfcqfc`). |
| Intros | From Esteban Gorupicz, `goru@cahusa.mx`, sent with Resend. |
| Languages | Spanish only. |

## What it is

**The directory.** Everyone in the community has a profile in `public.directory_profiles`:

- Imported Luma guests land as **private, unclaimed** drafts.
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
| `/directorio/<slug>` | A public profile. **Pedir intro** opens `/connect?intro=<slug>`; website always; LinkedIn and WhatsApp only for paid members who opted in. |
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
Stripe ── POST https://cahusa.mx/api/directorio/connect/stripe-webhook
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
| `scripts/import-luma-directory.mjs` | Luma CSV export → `directory_events` + `directory_profiles` (dry run by default) |
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

### Data (new Supabase project)

| Table / column | What |
|---|---|
| `directory_profiles` | Profiles. Public columns: id, slug, name, kind, company, job_title, headline, description, services, categories, city, website, photo_path, featured, updated_at. Private: email, linkedin_url, whatsapp, company_size, source_events, status, published, plan, show_contact, connect_opt_out. |
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
- Webhook destination `https://cahusa.mx/api/directorio/connect/stripe-webhook` with `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`.
- Checkout has `allow_promotion_codes` on, so discount codes created in Stripe work without code changes.
- Without the Stripe env vars the plans still show and **Suscribirme** answers "Las suscripciones todavía no están disponibles".
- Flow: Checkout with the profile id in the metadata → webhook upserts `connect_subscriptions` → `connect_apply_plan`. The plan follows the best live subscription (`active`, `trialing`, `past_due`); when it ends the member drops to Starter.

## Environment variables (Vercel, project `labolsamx/cahusamex`)

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

Without the Supabase variables or the session secret every API route answers `unavailable` and the directory shows "No pudimos cargar el directorio".

## Deploy steps (in order)

Nothing below has been done yet. Each production step needs the owner's OK.

1. **Supabase:** create the Cahusamex project (region close to Vercel's). Apply `supabase/migrations/20261113120000_directory_connect.sql` (SQL editor or `supabase db push`). Check the `directory-photos` bucket exists.
2. **Resend:** add `cahusa.mx` as a domain and add its DKIM/SPF records in **Cloudflare** (the zone is there, not in Vercel; the local Cloudflare token is read-only, so the owner adds them). The existing Email Routing for `goru@cahusa.mx` stays as is, so the Bcc and replies still reach the owner.
3. **Anthropic:** create an API key for Cahusamex Connect.
4. **Stripe (LA BOLSA MX - Club):** ~~create the two products and monthly MXN prices~~ (done 2026-11-13, ids above). Still to do: the webhook destination above (copy its signing secret), and a billing portal configuration for Connect only (switch between the two Connect prices, cancel at period end, invoice history, payment method), whose `bpc_…` id goes in `STRIPE_PORTAL_CONFIGURATION`. The Club account has no portal configuration at all yet; a dedicated one leaves the rest of the account alone.
5. **Vercel:** set the env vars above for Production (and Preview if wanted) on `labolsamx/cahusamex`. Also check the project's framework preset says Next.js (it still says Vite; `vercel.json` overrides it).
6. **Merge the PR** and let Vercel deploy.
7. **Import the pool:** export the guest CSV of each Cahusamex event from Luma and run `scripts/import-luma-directory.mjs` (dry run first, then `--apply`).
8. **Smoke test in production:** sign in at `/directorio/editar`, publish a profile, search in `/connect`, send one intro to a test profile you own, run a Checkout with a 100% coupon and check the plan changes, open the portal.

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
