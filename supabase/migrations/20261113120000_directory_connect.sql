-- cahusa.mx/directorio and cahusa.mx/connect, on the Cahusamex Supabase project.
--
-- Ported from Cancún Tech Day (cancuntechday repo, migrations 20261108123844 to 20261112230000),
-- folded into the final state of each object, for a fresh project:
--   * directory_profiles: everyone in the community. Rows imported from Luma guest lists land as
--     private, unclaimed profiles; a person claims theirs at /directorio/editar (email + 6-digit
--     code) and may publish it. Anyone may also create a profile there with any email.
--   * Connect: a member with a claimed profile describes an ICP, Claude ranks the pool, and the
--     member asks for intros that Esteban sends by email. Matches stay anonymous until then.
--   * Limits live here, not in the site: one intro per pair, 10 a day (America/Cancun), 3 free per
--     organization on Starter, ICPs per plan (Starter 1, Business 3, Business Plus 5).
--
-- Access: RLS is on everywhere. anon/authenticated read published profiles only, and only the
-- public columns (column grants). Everything else goes through the site's /api/directorio/*
-- route handlers with the service role.

-- ============================================================================================
-- 1. Profiles
-- ============================================================================================

create table public.directory_profiles (
  id uuid primary key default gen_random_uuid(),
  email text not null unique
    check (email = lower(btrim(email)) and char_length(email) between 3 and 200),
  slug text unique
    check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) <= 80 and slug not in ('editar', 'edit')),
  name text not null check (char_length(btrim(name)) between 1 and 120),
  kind text not null default 'professional' check (kind in ('company', 'professional')),
  company text check (char_length(company) <= 120),
  job_title text check (char_length(job_title) <= 120),
  headline text check (char_length(headline) <= 160),
  description text check (char_length(description) <= 2000),
  services text[] not null default '{}'
    check (cardinality(services) <= 12 and array_position(services, null) is null),
  categories text[] not null default '{}'
    check (cardinality(categories) <= 3 and categories <@ array[
      'vacation-rentals', 'hotels', 'property-management', 'real-estate', 'construction-design',
      'maintenance-cleaning', 'technology', 'marketing-sales', 'finance-legal', 'tourism',
      'consulting', 'other'
    ]::text[]),
  city text check (char_length(city) <= 80),
  website text check (char_length(website) <= 300 and website ~* '^https?://[^\s/]+\.[^\s]+$'),
  linkedin_url text check (char_length(linkedin_url) <= 300 and linkedin_url ~* '^https://([a-z0-9-]+\.)?linkedin\.com/\S*$'),
  whatsapp text check (whatsapp ~ '^[0-9]{8,15}$'),
  photo_path text check (char_length(photo_path) <= 200),
  company_size text check (company_size in ('1-10', '11-50', '51-200', '201-1000', '1000+')),
  source_events text[] not null default '{}',
  status text not null default 'unclaimed' check (status in ('unclaimed', 'claimed')),
  published boolean not null default false,
  claimed_at timestamptz,
  plan text not null default 'starter' check (plan in ('starter', 'business', 'business_plus')),
  featured boolean generated always as (plan = 'business_plus') stored,
  show_contact boolean not null default false,
  connect_opt_out boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint directory_profiles_published_is_claimed
    check (not published or (status = 'claimed' and slug is not null)),
  constraint directory_profiles_claim_has_date
    check ((status = 'claimed') = (claimed_at is not null))
);

comment on table public.directory_profiles is
  'cahusa.mx/directorio. Imported from Luma (unclaimed, private); public only when claimed and published. Writes: service role via /api/directorio/*.';
comment on column public.directory_profiles.email is 'Normalized (lowercase) email; the claim key. Never public.';
comment on column public.directory_profiles.source_events is 'directory_events slugs the person registered to. Empty for profiles created at /directorio/editar.';
comment on column public.directory_profiles.company_size is 'Employee range from the Luma import, when the event asked. Private; Connect shows it on anonymous matches.';
comment on column public.directory_profiles.linkedin_url is 'Private. Public only through directory_public_contact (paid plan + show_contact).';
comment on column public.directory_profiles.whatsapp is 'Private, digits with country code. Public only through directory_public_contact (paid plan + show_contact).';
comment on column public.directory_profiles.plan is 'Connect plan. Set only from the Stripe subscription (connect_apply_plan); starter when there is none.';
comment on column public.directory_profiles.featured is 'Business Plus: listed first in /directorio with a badge. Public.';
comment on column public.directory_profiles.show_contact is 'Business / Business Plus perk: show LinkedIn and WhatsApp on the public profile. Ignored on Starter.';
comment on column public.directory_profiles.connect_opt_out is 'Set by hand when someone asks not to be suggested or introduced in Connect. Excluded from matches and intros.';

create function public.directory_profiles_touch() returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger directory_profiles_touch
  before update on public.directory_profiles
  for each row execute function public.directory_profiles_touch();

alter table public.directory_profiles enable row level security;
revoke all on public.directory_profiles from anon, authenticated;

-- Public columns only. A query that names any other column (email, published, linkedin_url...)
-- fails with "permission denied", so `select=*` with the anon key fails too.
grant select (id, slug, name, kind, company, job_title, headline, description, services,
              categories, city, website, photo_path, featured, updated_at)
  on public.directory_profiles to anon, authenticated;

create policy directory_profiles_read_published on public.directory_profiles
  for select to anon, authenticated
  using (published);

-- ============================================================================================
-- 2. Events the pool comes from (the intro email thanks the match for registering to one)
-- ============================================================================================

create table public.directory_events (
  slug text primary key check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) <= 80),
  name text not null check (char_length(btrim(name)) between 1 and 120),
  starts_on date,
  created_at timestamptz not null default now()
);

comment on table public.directory_events is
  'Cahusamex events whose Luma guests were imported (scripts/import-luma-directory.mjs). name is how the intro email names it.';

alter table public.directory_events enable row level security;
revoke all on public.directory_events from anon, authenticated;

-- ============================================================================================
-- 3. Sign-in codes (email + 6-digit code)
-- ============================================================================================

create table public.directory_email_codes (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  ip_hash text,
  code_hash text,
  sent boolean not null default false,
  attempts integer not null default 0,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  used_at timestamptz
);
create index directory_email_codes_email_created on public.directory_email_codes (email, created_at desc);
create index directory_email_codes_ip_created on public.directory_email_codes (ip_hash, created_at desc);
create index directory_email_codes_created on public.directory_email_codes (created_at desc);

comment on table public.directory_email_codes is
  'Verification codes for cahusa.mx/directorio/editar and /connect; written only by /api/directorio/* (service role). The code is stored as an HMAC.';

alter table public.directory_email_codes enable row level security;
revoke all on public.directory_email_codes from anon, authenticated;

-- ============================================================================================
-- 4. Photos and logos: public bucket, names <profile id>/<uuid>.<ext>, only the service role writes
-- ============================================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('directory-photos', 'directory-photos', true, 3145728, array['image/jpeg', 'image/png', 'image/webp']);

-- ============================================================================================
-- 5. Slugs and the Luma import
-- ============================================================================================

create function public.directory_slugify(p_name text) returns text
language sql
immutable
set search_path = ''
as $$
  select trim(both '-' from regexp_replace(
    translate(lower(p_name), 'áàäâãéèëêíìïîóòöôõúùüûñç', 'aaaaaeeeeiiiiooooouuuunc'),
    '[^a-z0-9]+', '-', 'g'));
$$;

-- A free slug from a name: accents stripped, '-2', '-3'... on collision, reserved words skipped.
create function public.directory_free_slug(p_name text, p_id uuid) returns text
language plpgsql
stable
set search_path = ''
as $$
declare
  base text := trim(both '-' from left(coalesce(nullif(public.directory_slugify(p_name), ''), 'perfil'), 60));
  candidate text := base;
  n integer := 1;
begin
  while candidate in ('editar', 'edit')
     or exists (select 1 from public.directory_profiles where slug = candidate and id <> p_id) loop
    n := n + 1;
    candidate := base || '-' || n;
  end loop;
  return candidate;
end;
$$;

-- Bulk upsert for the Luma import. Keyed on the normalized email; running it again with the same
-- rows changes nothing. Unclaimed rows take the fresh Luma data (keeping what the new data lacks);
-- claimed rows only gain source events, so an import never overwrites what a person wrote.
-- Returns how many rows were inserted, updated and left unchanged.
create function public.directory_import_profiles(p_rows jsonb)
returns table (inserted integer, updated integer, unchanged integer)
language plpgsql
set search_path = ''
as $$
declare
  v_total integer;
  v_inserted integer;
  v_updated integer;
begin
  drop table if exists pg_temp.directory_import_src;
  create temporary table directory_import_src on commit drop as
  select distinct on (email) *
    from (
      select lower(btrim(r.email)) as email,
             left(coalesce(nullif(btrim(r.name), ''), split_part(lower(btrim(r.email)), '@', 1)), 120) as name,
             left(nullif(btrim(r.company), ''), 120) as company,
             left(nullif(btrim(r.job_title), ''), 120) as job_title,
             case when btrim(r.linkedin_url) ~* '^https://([a-z0-9-]+\.)?linkedin\.com/\S*$'
                       and char_length(btrim(r.linkedin_url)) <= 300
                  then btrim(r.linkedin_url) end as linkedin_url,
             left(nullif(btrim(r.city), ''), 80) as city,
             case when r.company_size in ('1-10', '11-50', '51-200', '201-1000', '1000+') then r.company_size end as company_size,
             coalesce((select array_agg(distinct e order by e) from unnest(r.source_events) e where e is not null), '{}') as source_events
        from jsonb_to_recordset(p_rows) as r(email text, name text, company text, job_title text,
                                             linkedin_url text, city text, company_size text, source_events text[])
       where lower(btrim(r.email)) ~ '^[^\s@]+@[^\s@]+\.[^\s@]{2,}$'
         and char_length(btrim(r.email)) <= 200
    ) s
   order by email;

  select count(*) into v_total from directory_import_src;

  insert into public.directory_profiles (email, name, company, job_title, linkedin_url, city, company_size, source_events)
  select s.email, s.name, s.company, s.job_title, s.linkedin_url, s.city, s.company_size, s.source_events
    from directory_import_src s
   where not exists (select 1 from public.directory_profiles p where p.email = s.email);
  get diagnostics v_inserted = row_count;

  with merged as (
    select p.id,
           (select coalesce(array_agg(distinct e order by e), '{}') from unnest(p.source_events || s.source_events) e) as source_events,
           case when p.status = 'unclaimed' then s.name else p.name end as name,
           case when p.status = 'unclaimed' then coalesce(s.company, p.company) else p.company end as company,
           case when p.status = 'unclaimed' then coalesce(s.job_title, p.job_title) else p.job_title end as job_title,
           case when p.status = 'unclaimed' then coalesce(s.linkedin_url, p.linkedin_url) else p.linkedin_url end as linkedin_url,
           case when p.status = 'unclaimed' then coalesce(s.city, p.city) else p.city end as city,
           -- The size is never typed by the person, so a fresh value always wins.
           coalesce(s.company_size, p.company_size) as company_size
      from public.directory_profiles p
      join directory_import_src s on s.email = p.email
  )
  update public.directory_profiles p
     set source_events = m.source_events,
         name = m.name,
         company = m.company,
         job_title = m.job_title,
         linkedin_url = m.linkedin_url,
         city = m.city,
         company_size = m.company_size
    from merged m
   where p.id = m.id
     and (p.source_events, p.name, p.company, p.job_title, p.linkedin_url, p.city, p.company_size)
         is distinct from (m.source_events, m.name, m.company, m.job_title, m.linkedin_url, m.city, m.company_size);
  get diagnostics v_updated = row_count;
  -- Rows inserted above are matched by the update too, but they are already equal, so they never
  -- count as updated.

  return query select v_inserted, v_updated, v_total - v_inserted - v_updated;
end;
$$;

-- ============================================================================================
-- 6. Contact through the directory: only paid members who opt in show LinkedIn / WhatsApp
-- ============================================================================================

create function public.directory_public_contact(p_slug text)
returns table (linkedin_url text, whatsapp text)
language sql stable
security definer
set search_path = ''
as $$
  select p.linkedin_url, p.whatsapp
    from public.directory_profiles p
   where p.slug = p_slug
     and p.published
     and p.show_contact
     and p.plan in ('business', 'business_plus')
$$;

-- ============================================================================================
-- 7. Connect: subscriptions, searches, ICPs, intros
-- ============================================================================================

create table public.connect_subscriptions (
  stripe_subscription_id text primary key,
  profile_id uuid not null references public.directory_profiles (id) on delete cascade,
  stripe_customer_id text,
  plan text not null check (plan in ('business', 'business_plus')),
  status text not null,
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index connect_subscriptions_profile on public.connect_subscriptions (profile_id);

comment on table public.connect_subscriptions is
  'Stripe subscriptions for cahusa.mx/connect, upserted by the /api/directorio/connect/stripe-webhook route.';

-- The ICP, what Claude returned ([{id, score, label, reason}]), and the pitch the intro uses.
create table public.connect_searches (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references public.directory_profiles (id) on delete cascade,
  icp text not null check (char_length(icp) between 20 and 2000),
  pitch text check (char_length(pitch) <= 200),
  results jsonb not null default '[]',
  created_at timestamptz not null default now()
);
create index connect_searches_requester on public.connect_searches (requester_id, created_at desc);
create index connect_searches_created on public.connect_searches (created_at desc);

comment on table public.connect_searches is
  'ICP searches on cahusa.mx/connect. results = [{id, score, label, reason}] ranked by Claude.';

-- One row per member and ICP: an ICP is used up by its first intro.
create table public.connect_icps (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.directory_profiles (id) on delete cascade,
  icp text not null check (char_length(icp) between 20 and 2000),
  icp_key text not null,
  created_at timestamptz not null default now(),
  unique (profile_id, icp_key)
);

comment on table public.connect_icps is
  'ICPs a member used on cahusa.mx/connect (one row per distinct ICP text that sent an intro).';

-- A pair is introduced once, in either direction. A failed send deletes its row.
create table public.connect_intros (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references public.directory_profiles (id) on delete cascade,
  match_id uuid not null references public.directory_profiles (id) on delete cascade,
  plan text not null check (plan in ('starter', 'business', 'business_plus')),
  icp_id uuid references public.connect_icps (id) on delete set null,
  status text not null default 'pending' check (status in ('pending', 'sent')),
  resend_id text,
  created_at timestamptz not null default now(),
  sent_at timestamptz,
  check (requester_id <> match_id)
);
create unique index connect_intros_pair
  on public.connect_intros (least(requester_id, match_id), greatest(requester_id, match_id));
create index connect_intros_requester on public.connect_intros (requester_id, created_at desc);
create index connect_intros_icp on public.connect_intros (icp_id);

comment on table public.connect_intros is
  'Intros sent from goru@cahusa.mx by cahusa.mx/connect. A failed send deletes its row.';

alter table public.connect_subscriptions enable row level security;
alter table public.connect_searches enable row level security;
alter table public.connect_icps enable row level security;
alter table public.connect_intros enable row level security;
revoke all on public.connect_subscriptions, public.connect_searches, public.connect_icps, public.connect_intros
  from anon, authenticated;

-- ============================================================================================
-- 8. Connect helpers
-- ============================================================================================

-- Start of today in Cancún, where the 10-per-day limit resets.
create function public.connect_day_start() returns timestamptz
language sql stable
set search_path = ''
as $$
  select date_trunc('day', now() at time zone 'America/Cancun') at time zone 'America/Cancun'
$$;

-- How two ICP texts are compared, and how many ICPs each plan allows (same numbers as
-- ICP_LIMITS in src/lib/connect/limits.ts).
create function public.connect_icp_key(p_icp text) returns text
language sql immutable
set search_path = ''
as $$
  select lower(btrim(regexp_replace(p_icp, '\s+', ' ', 'g')))
$$;

create function public.connect_icp_limit(p_plan text) returns integer
language sql immutable
set search_path = ''
as $$
  select case p_plan when 'business_plus' then 5 when 'business' then 3 else 1 end
$$;

-- Whether a profile may search with this ICP: one they already used, or they still have room.
-- The site checks it before calling Claude, so a search that could never send costs nothing.
create function public.connect_icp_allowed(p_profile uuid, p_icp text) returns boolean
language sql stable
set search_path = ''
as $$
  select exists (select 1 from public.connect_icps i
                  where i.profile_id = p_profile and i.icp_key = public.connect_icp_key(p_icp))
      or (select count(*) from public.connect_icps i where i.profile_id = p_profile)
         < public.connect_icp_limit((select p.plan from public.directory_profiles p where p.id = p_profile))
$$;

-- Gives an ICP back when no intro from it went out (called after failed sends).
create function public.connect_release_icp(p_icp uuid) returns void
language sql
set search_path = ''
as $$
  delete from public.connect_icps i
   where i.id = p_icp
     and not exists (select 1 from public.connect_intros n where n.icp_id = p_icp)
$$;

-- The corporate part of an email: its domain, unless it is a personal mail provider.
create function public.connect_org_domain(p_email text) returns text
language sql immutable
set search_path = ''
as $$
  select case
    when d is null or d = '' then null
    when d in (
      'gmail.com', 'googlemail.com', 'hotmail.com', 'hotmail.es', 'hotmail.com.mx', 'outlook.com',
      'outlook.es', 'outlook.com.mx', 'live.com', 'live.com.mx', 'msn.com', 'yahoo.com', 'yahoo.com.mx',
      'yahoo.es', 'ymail.com', 'icloud.com', 'me.com', 'mac.com', 'aol.com', 'protonmail.com', 'proton.me',
      'pm.me', 'gmx.com', 'gmx.net', 'zoho.com', 'mail.com', 'yandex.com', 'prodigy.net.mx', 'tutanota.com',
      'hey.com', 'fastmail.com'
    ) then null
    else d
  end
  from (select lower(btrim(split_part(p_email, '@', 2))) as d) x
$$;

-- A company name reduced to what identifies it ("Grupo Xcaret S.A. de C.V." = "grupo xcaret").
create function public.connect_org_company(p_company text) returns text
language sql immutable
set search_path = ''
as $$
  select case
    when k is null or char_length(k) < 3 then null
    when k in ('na', 'none', 'ninguna', 'ninguno', 'independiente', 'freelance', 'freelancer', 'selfemployed',
               'autonomo', 'personal', 'noaplica', 'propia', 'propio', 'mipropiaempresa', 'emprendedor',
               'estudiante', 'student', 'consultor', 'consultora', 'consultant')
      then null
    else k
  end
  from (
    select regexp_replace(
             regexp_replace(
               translate(lower(btrim(coalesce(p_company, ''))), 'áéíóúüñàèìòùâêîôûç', 'aeiouunaeiouaeiouc'),
               '\m(s\.?\s*a\.?\s*p\.?\s*i\.?|s\.?\s*a\.?|s\.?\s*de\s*r\.?\s*l\.?|s\.?\s*c\.?|de\s*c\.?\s*v\.?|inc|llc|ltd|corp|co)\.?\M',
               '', 'g'),
             '[^a-z0-9]', '', 'g') as k
  ) x
$$;

-- Starter intros already reserved by anyone in the profile's organization (the profile included).
-- The organization is the profile, the profiles sharing its corporate domain or company, and one
-- hop further (so a Gmail user at "Acme" and a colleague with an @acme.com address share it).
create function public.connect_free_used(p_profile uuid) returns integer
language sql stable
set search_path = ''
as $$
  with me as (
    select p.id, public.connect_org_domain(p.email) as dom, public.connect_org_company(p.company) as comp
      from public.directory_profiles p where p.id = p_profile
  ),
  direct as (
    select r.id, public.connect_org_domain(r.email) as dom, public.connect_org_company(r.company) as comp
      from public.directory_profiles r cross join me
     where r.id = me.id
        or (me.dom is not null and public.connect_org_domain(r.email) = me.dom)
        or (me.comp is not null and public.connect_org_company(r.company) = me.comp)
  )
  select count(*)::integer
    from public.connect_intros i
    join public.directory_profiles r on r.id = i.requester_id
   where i.plan = 'starter'
     and (r.id in (select id from direct)
          or public.connect_org_domain(r.email) in (select dom from direct where dom is not null)
          or public.connect_org_company(r.company) in (select comp from direct where comp is not null))
$$;

-- ============================================================================================
-- 9. Reserving intros (the only way an intro row is created)
-- ============================================================================================

-- From a search: locks the requester's row so two tabs can't both spend the last free intro.
-- Only people in that search (of the last 7 days) can be introduced, and the search's ICP is used
-- up here. Raises no_profile, search_expired, daily_limit, free_limit or icp_limit when the whole
-- request doesn't fit (nothing is reserved then). Returns the reserved rows; people already
-- introduced, opted out or not in the search are skipped.
create function public.connect_reserve_intros(p_requester uuid, p_search uuid, p_matches uuid[])
returns table (intro_id uuid, match_id uuid, icp_id uuid)
language plpgsql
set search_path = ''
as $$
#variable_conflict use_column
declare
  v_plan text;
  v_email text;
  v_company text;
  v_icp text;
  v_icp_id uuid;
  v_today integer;
  v_wanted uuid[];
begin
  select p.plan, p.email, p.company into v_plan, v_email, v_company
    from public.directory_profiles p
   where p.id = p_requester and p.status = 'claimed'
     for update;
  if v_plan is null then
    raise exception 'no_profile';
  end if;

  select s.icp into v_icp
    from public.connect_searches s
   where s.id = p_search and s.requester_id = p_requester and s.created_at > now() - interval '7 days';
  if v_icp is null then
    raise exception 'search_expired';
  end if;

  select coalesce(array_agg(m), '{}') into v_wanted
    from (select distinct m from unnest(p_matches) m) u
   where m <> p_requester
     and exists (select 1 from public.connect_searches s
                  where s.id = p_search
                    and s.results @> jsonb_build_array(jsonb_build_object('id', m)))
     and not exists (select 1 from public.directory_profiles x where x.id = m and x.connect_opt_out)
     and not exists (select 1 from public.connect_intros i
                      where least(i.requester_id, i.match_id) = least(p_requester, m)
                        and greatest(i.requester_id, i.match_id) = greatest(p_requester, m));

  if cardinality(v_wanted) = 0 then
    return;
  end if;

  select count(*) into v_today
    from public.connect_intros i
   where i.requester_id = p_requester and i.created_at >= public.connect_day_start();
  if v_today + cardinality(v_wanted) > 10 then
    raise exception 'daily_limit';
  end if;

  if v_plan = 'starter' then
    if public.connect_org_domain(v_email) is not null then
      perform pg_advisory_xact_lock(hashtext('connect-free-domain:' || public.connect_org_domain(v_email)));
    end if;
    if public.connect_org_company(v_company) is not null then
      perform pg_advisory_xact_lock(hashtext('connect-free-company:' || public.connect_org_company(v_company)));
    end if;
    if public.connect_free_used(p_requester) + cardinality(v_wanted) > 3 then
      raise exception 'free_limit';
    end if;
  end if;

  select i.id into v_icp_id
    from public.connect_icps i
   where i.profile_id = p_requester and i.icp_key = public.connect_icp_key(v_icp);
  if v_icp_id is null then
    if (select count(*) from public.connect_icps i where i.profile_id = p_requester)
       >= public.connect_icp_limit(v_plan) then
      raise exception 'icp_limit';
    end if;
    insert into public.connect_icps (profile_id, icp, icp_key)
    values (p_requester, v_icp, public.connect_icp_key(v_icp))
    returning connect_icps.id into v_icp_id;
  end if;

  return query
    with inserted as (
      insert into public.connect_intros (requester_id, match_id, plan, icp_id)
      select p_requester, m, v_plan, v_icp_id from unnest(v_wanted) m
      returning connect_intros.id, connect_intros.match_id, connect_intros.icp_id
    )
    select inserted.id, inserted.match_id, inserted.icp_id from inserted;
end;
$$;

-- Direct: from a member to one published directory profile, without a search. Same limits as any
-- intro (one per pair, 10 a day, the organization's 3 free on Starter); it uses no ICP. Raises
-- no_profile, not_found, self_intro, daily_limit or free_limit; returns the intro id, or null when
-- the pair was already introduced.
create function public.connect_reserve_direct_intro(p_requester uuid, p_match uuid)
returns uuid
language plpgsql
set search_path = ''
as $$
declare
  v_plan text;
  v_email text;
  v_company text;
  v_today integer;
  v_id uuid;
begin
  select p.plan, p.email, p.company into v_plan, v_email, v_company
    from public.directory_profiles p
   where p.id = p_requester and p.status = 'claimed'
     for update;
  if v_plan is null then
    raise exception 'no_profile';
  end if;
  if p_match = p_requester then
    raise exception 'self_intro';
  end if;
  if not exists (select 1 from public.directory_profiles m
                  where m.id = p_match and m.published and not m.connect_opt_out) then
    raise exception 'not_found';
  end if;
  if exists (select 1 from public.connect_intros i
              where least(i.requester_id, i.match_id) = least(p_requester, p_match)
                and greatest(i.requester_id, i.match_id) = greatest(p_requester, p_match)) then
    return null;
  end if;

  select count(*) into v_today
    from public.connect_intros i
   where i.requester_id = p_requester and i.created_at >= public.connect_day_start();
  if v_today + 1 > 10 then
    raise exception 'daily_limit';
  end if;

  if v_plan = 'starter' then
    if public.connect_org_domain(v_email) is not null then
      perform pg_advisory_xact_lock(hashtext('connect-free-domain:' || public.connect_org_domain(v_email)));
    end if;
    if public.connect_org_company(v_company) is not null then
      perform pg_advisory_xact_lock(hashtext('connect-free-company:' || public.connect_org_company(v_company)));
    end if;
    if public.connect_free_used(p_requester) + 1 > 3 then
      raise exception 'free_limit';
    end if;
  end if;

  insert into public.connect_intros (requester_id, match_id, plan)
  values (p_requester, p_match, v_plan)
  returning id into v_id;
  return v_id;
end;
$$;

-- The plan follows the best live subscription of the profile (or starter when none is live).
create function public.connect_apply_plan(p_profile uuid) returns text
language plpgsql
set search_path = ''
as $$
declare
  v_plan text;
begin
  select coalesce(
           (select s.plan from public.connect_subscriptions s
             where s.profile_id = p_profile and s.status in ('active', 'trialing', 'past_due')
             order by (s.plan = 'business_plus') desc
             limit 1),
           'starter')
    into v_plan;
  update public.directory_profiles set plan = v_plan where id = p_profile and plan <> v_plan;
  return v_plan;
end;
$$;

-- ============================================================================================
-- 10. Function privileges: only the service role, except the public contact lookup
-- ============================================================================================

revoke execute on function
  public.directory_profiles_touch(),
  public.directory_slugify(text),
  public.directory_free_slug(text, uuid),
  public.directory_import_profiles(jsonb),
  public.directory_public_contact(text),
  public.connect_day_start(),
  public.connect_icp_key(text),
  public.connect_icp_limit(text),
  public.connect_icp_allowed(uuid, text),
  public.connect_release_icp(uuid),
  public.connect_org_domain(text),
  public.connect_org_company(text),
  public.connect_free_used(uuid),
  public.connect_reserve_intros(uuid, uuid, uuid[]),
  public.connect_reserve_direct_intro(uuid, uuid),
  public.connect_apply_plan(uuid)
  from public, anon, authenticated;

grant execute on function
  public.directory_slugify(text),
  public.directory_free_slug(text, uuid),
  public.directory_import_profiles(jsonb),
  public.directory_public_contact(text),
  public.connect_day_start(),
  public.connect_icp_key(text),
  public.connect_icp_limit(text),
  public.connect_icp_allowed(uuid, text),
  public.connect_release_icp(uuid),
  public.connect_org_domain(text),
  public.connect_org_company(text),
  public.connect_free_used(uuid),
  public.connect_reserve_intros(uuid, uuid, uuid[]),
  public.connect_reserve_direct_intro(uuid, uuid),
  public.connect_apply_plan(uuid)
  to service_role;

grant execute on function public.directory_public_contact(text) to anon, authenticated;
