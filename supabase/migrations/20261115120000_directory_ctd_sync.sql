-- ============================================================================================
-- Cancún Tech Day directory profiles in cahusa.mx/directorio, kept in step (owner's request, 2026-11-14)
-- ============================================================================================
--
-- The cron at /api/directorio/ctd-sync already pushes this directory to cancuntech.day. Now, in
-- the same run, it also reads cancuntech.day's own profiles (its Luma registrants and the people
-- who claimed or created a profile there) through its token-gated directory_cahusamex_export
-- (cancuntechday repo, supabase/migrations/20261115120000_directory_cahusamex_export.sql) and
-- applies them here with the service role:
--
--   directory_ctd_sync(rows)   up to 1000 rows per call, each a published profile there,
--                              {email_sha256, hidden: true} for someone who left there, or
--                              {email_sha256, held: true} (ignored here: see below);
--   directory_ctd_finish(seen) the sha-256 of every email the export returned: a profile synced
--                              before and missing now (deleted there) counts as hidden.
--
-- Same rules as cancuntech.day's copy of us (directory_profiles.ctd_status: imported / claimed /
-- hidden, private):
--   * a new email gets a profile here: unclaimed, published (with a name of its own), tagged
--     source_events 'cancuntechday';
--   * claimed THERE: what the person wrote there (name, kind, company, job title, headline,
--     description, services, categories, city, website, photo) replaces this copy, and the Luma
--     import no longer overwrites it here;
--   * imported there (unclaimed): only fills what this copy lacks (and a name, when ours is only
--     the email's local part);
--   * left there (unpublished by its owner, opted out, deleted): this copy is unpublished. If they
--     come back, it is published again;
--   * claimed HERE: the person owns this copy; cancuntech.day changes nothing but the tag and status.
--
-- No loops: cancuntech.day never exports an unclaimed copy of one of our profiles, and the cron
-- never pushes an unclaimed copy of one of theirs (source_events exactly '{cancuntechday}').
-- A profile unpublished on one side only because it left the other travels as "held": the
-- other side counts it as seen and changes nothing, so an opt-out never comes back as one.
--
-- Photos stay in cancuntech.day's public bucket: photo_path may hold one of its URLs. A
-- cancuntech.day row that points at our own bucket becomes our path again.
-- WhatsApp never travels.

alter table public.directory_profiles
  add column ctd_status text check (ctd_status in ('imported', 'claimed', 'hidden'));

comment on column public.directory_profiles.ctd_status is
  'Private. The same email in the cancuntech.day directory, as a profile of its own: imported (published there, unclaimed), claimed (published there by its owner), hidden (left it). Null: not there, or there only as a copy of ours.';

alter table public.directory_profiles
  add constraint directory_profiles_photo_path_source check (
    photo_path !~ '^[a-z]+://'
    or photo_path ~ '^https://mmpdnezqnwcfjjguvdcw\.supabase\.co/storage/v1/object/public/directory-photos/[A-Za-z0-9/_.-]+$'
  );

create table public.directory_sync_state (
  source text primary key,
  last_sync_at timestamptz,
  last_result jsonb
);

comment on table public.directory_sync_state is
  'Last run of each directory we read profiles from (ctd: cancuntech.day). No grants.';

alter table public.directory_sync_state enable row level security;
revoke all on public.directory_sync_state from anon, authenticated;

create function public.directory_email_sha256(p_email text) returns text
language sql
immutable
set search_path = ''
as $$
  select encode(sha256(convert_to(lower(btrim(p_email)), 'UTF8')), 'hex')
$$;

-- People who left there are matched by the hash of their email.
create index directory_profiles_email_sha256 on public.directory_profiles (public.directory_email_sha256(email));

create function public.directory_clean_line(p_value text, p_max integer) returns text
language sql
immutable
set search_path = ''
as $$
  select left(nullif(btrim(regexp_replace(p_value, '\s+', ' ', 'g')), ''), p_max)
$$;

-- A name of its own: never an email, never the email's local part.
create function public.directory_own_name(p_name text, p_email text) returns boolean
language sql
immutable
set search_path = ''
as $$
  select nullif(btrim(p_name), '') is not null
     and position('@' in p_name) = 0
     and lower(btrim(p_name)) <> split_part(lower(btrim(p_email)), '@', 1)
$$;

-- cancuntech.day categories (tech) -> ours (hospitality). The inverse of its
-- directory_map_cahusamex_categories where there is one.
create function public.directory_map_ctd_categories(p_categories text[]) returns text[]
language sql
immutable
set search_path = ''
as $$
  select coalesce(array_agg(c order by first), '{}')
    from (
      select c, min(i) as first
        from (
          select case k
                   when 'hospitality' then 'hotels'
                   when 'real-estate' then 'real-estate'
                   when 'software' then 'technology'
                   when 'ai-data' then 'technology'
                   when 'startups' then 'technology'
                   when 'marketing' then 'marketing-sales'
                   when 'finance-legal' then 'finance-legal'
                   when 'consulting' then 'consulting'
                   when 'design' then 'other'
                   when 'education' then 'other'
                   when 'operations' then 'other'
                   when 'other' then 'other'
                 end as c, i
            from unnest(coalesce(p_categories, '{}')) with ordinality u(k, i)
        ) mapped
       where c is not null
       group by c
       order by min(i)
       limit 3
    ) t
$$;

-- Publish or unpublish the unclaimed profiles given, by their cancuntech.day status.
create function public.directory_ctd_apply(p_ids uuid[]) returns table (published integer, unpublished integer)
language plpgsql
set search_path = ''
as $$
declare
  v_pub integer := 0;
  v_unpub integer;
  rec record;
begin
  update public.directory_profiles p
     set published = false
   where p.id = any (p_ids) and p.status = 'unclaimed' and p.published and p.ctd_status = 'hidden';
  get diagnostics v_unpub = row_count;

  for rec in
    select p.id, p.name, p.slug
      from public.directory_profiles p
     where p.id = any (p_ids) and p.status = 'unclaimed' and not p.published and not p.connect_opt_out
       and p.ctd_status in ('imported', 'claimed')
       and public.directory_own_name(p.name, p.email)
     order by p.created_at, p.id
  loop
    update public.directory_profiles
       set slug = coalesce(rec.slug, public.directory_free_slug(rec.name, rec.id)), published = true
     where id = rec.id;
    v_pub := v_pub + 1;
  end loop;

  return query select v_pub, v_unpub;
end;
$$;

create function public.directory_ctd_sync(p_rows jsonb, p_dry_run boolean default false)
returns jsonb
language plpgsql
set search_path = ''
as $$
declare
  v_own_photo_re constant text := '^https://xfkicfgxznzvuffnufts\.supabase\.co/storage/v1/object/public/directory-photos/([A-Za-z0-9/_.-]+)$';
  v_ctd_photo_re constant text := '^https://mmpdnezqnwcfjjguvdcw\.supabase\.co/storage/v1/object/public/directory-photos/[A-Za-z0-9/_.-]+$';
  v_inserted uuid[];
  v_updated uuid[];
  v_hidden uuid[];
  v_pub integer;
  v_unpub integer;
  v_result jsonb;
begin
  if jsonb_typeof(p_rows) is distinct from 'array' or jsonb_array_length(p_rows) > 1000 then
    raise exception 'rows must be an array of at most 1000' using errcode = '22023';
  end if;

  begin
    drop table if exists pg_temp.ctd_src;
    create temporary table ctd_src on commit drop as
    select distinct on (email_sha256) *
      from (
        select lower(btrim(r.email)) as email,
               coalesce(case when coalesce(r.hidden, false) then lower(r.email_sha256) end,
                        public.directory_email_sha256(r.email)) as email_sha256,
               coalesce(r.hidden, false) as hidden,
               case when r.status = 'claimed' then 'claimed' else 'imported' end as cstatus,
               public.directory_clean_line(r.name, 120) as name,
               case when r.kind = 'company' then 'company' else 'professional' end as kind,
               public.directory_clean_line(r.company, 120) as company,
               public.directory_clean_line(r.job_title, 120) as job_title,
               public.directory_clean_line(r.headline, 160) as headline,
               left(nullif(btrim(r.description), ''), 2000) as description,
               coalesce((select array_agg(x order by i)
                           from (select public.directory_clean_line(s, 60) as x, i
                                   from unnest(coalesce(r.services, '{}')) with ordinality u(s, i)
                                  where public.directory_clean_line(s, 60) is not null
                                  order by i limit 12) t), '{}') as services,
               public.directory_map_ctd_categories(r.categories) as categories,
               public.directory_clean_line(r.city, 80) as city,
               case when btrim(r.website) ~* '^https?://[^\s/]+\.[^\s]+$' and char_length(btrim(r.website)) <= 300
                    then btrim(r.website) end as website,
               case when btrim(r.linkedin_url) ~* '^https://([a-z0-9-]+\.)?linkedin\.com/\S*$'
                         and char_length(btrim(r.linkedin_url)) <= 300
                    then btrim(r.linkedin_url) end as linkedin_url,
               case when char_length(r.photo_url) > 200 then null
                    when r.photo_url ~ v_own_photo_re then substring(r.photo_url from v_own_photo_re)
                    when r.photo_url ~ v_ctd_photo_re then r.photo_url end as photo
          from jsonb_to_recordset(p_rows) as r(email text, email_sha256 text, hidden boolean, held boolean,
                                               status text, name text, kind text, company text, job_title text,
                                               headline text, description text, services text[],
                                               categories text[], city text, website text, linkedin_url text,
                                               photo_url text)
         where not coalesce(r.held, false)
           and ((coalesce(r.hidden, false) and lower(r.email_sha256) ~ '^[0-9a-f]{64}$')
             or (not coalesce(r.hidden, false)
                 and lower(btrim(r.email)) ~ '^[^\s@]+@[^\s@]+\.[^\s@]{2,}$'
                 and char_length(btrim(r.email)) <= 200
                 and public.directory_clean_line(r.name, 120) is not null))
      ) s
     order by email_sha256, hidden desc;

    -- People who left cancuntech.day: matched by the hash, never by an email we would learn.
    with h as (
      update public.directory_profiles p
         set ctd_status = 'hidden'
        from ctd_src s
       where s.hidden and public.directory_email_sha256(p.email) = s.email_sha256
         and p.ctd_status is distinct from 'hidden'
      returning p.id
    )
    select coalesce(array_agg(id), '{}') into v_hidden from h;

    -- A new email only when it has a name of its own (it would never be published otherwise).
    with ins as (
      insert into public.directory_profiles (email, name, kind, company, job_title, headline, description, services,
                                             categories, city, website, linkedin_url, photo_path, source_events,
                                             ctd_status)
      select s.email, s.name, s.kind, s.company, s.job_title, s.headline, s.description, s.services, s.categories,
             s.city, s.website, s.linkedin_url, s.photo, '{cancuntechday}', s.cstatus
        from ctd_src s
       where not s.hidden
         and public.directory_own_name(s.name, s.email)
         and not exists (select 1 from public.directory_profiles p where p.email = s.email)
      returning id
    )
    select coalesce(array_agg(id), '{}') into v_inserted from ins;

    with merged as (
      select p.id,
             (select array_agg(distinct e order by e) from unnest(p.source_events || '{cancuntechday}'::text[]) e) as source_events,
             s.cstatus as ctd_status,
             -- Claimed here: the person owns this copy. Claimed there: what they wrote there wins.
             -- Imported there: only fills what is missing.
             case when p.status = 'claimed' then p.name
                  when s.cstatus = 'claimed' and s.name is not null then s.name
                  when not public.directory_own_name(p.name, p.email) and public.directory_own_name(s.name, s.email) then s.name
                  else p.name end as name,
             case when p.status = 'claimed' then p.kind
                  when s.cstatus = 'claimed' then s.kind else p.kind end as kind,
             case when p.status = 'claimed' then p.company
                  when s.cstatus = 'claimed' then s.company else coalesce(p.company, s.company) end as company,
             case when p.status = 'claimed' then p.job_title
                  when s.cstatus = 'claimed' then s.job_title else coalesce(p.job_title, s.job_title) end as job_title,
             case when p.status = 'claimed' then p.headline
                  when s.cstatus = 'claimed' then s.headline else coalesce(p.headline, s.headline) end as headline,
             case when p.status = 'claimed' then p.description
                  when s.cstatus = 'claimed' then s.description else coalesce(p.description, s.description) end as description,
             case when p.status = 'claimed' then p.services
                  when s.cstatus = 'claimed' or p.services = '{}' then s.services else p.services end as services,
             case when p.status = 'claimed' then p.categories
                  when s.cstatus = 'claimed' or p.categories = '{}' then s.categories else p.categories end as categories,
             case when p.status = 'claimed' then p.city
                  when s.cstatus = 'claimed' then s.city else coalesce(p.city, s.city) end as city,
             case when p.status = 'claimed' then p.website
                  when s.cstatus = 'claimed' then s.website else coalesce(p.website, s.website) end as website,
             case when p.status = 'claimed' then p.linkedin_url else coalesce(p.linkedin_url, s.linkedin_url) end as linkedin_url,
             -- A photo in our own bucket is kept unless they claimed it there and chose another.
             case when p.status = 'claimed' then p.photo_path
                  when p.photo_path is null or p.photo_path ~ '^https://' then s.photo
                  when s.cstatus = 'claimed' and s.photo is not null then s.photo
                  else p.photo_path end as photo_path
        from public.directory_profiles p
        join ctd_src s on s.email = p.email and not s.hidden
    ),
    upd as (
      update public.directory_profiles p
         set source_events = m.source_events, ctd_status = m.ctd_status, name = m.name, kind = m.kind,
             company = m.company, job_title = m.job_title, headline = m.headline, description = m.description,
             services = m.services, categories = m.categories, city = m.city, website = m.website,
             linkedin_url = m.linkedin_url, photo_path = m.photo_path
        from merged m
       where p.id = m.id
         and (p.source_events, p.ctd_status, p.name, p.kind, p.company, p.job_title, p.headline, p.description,
              p.services, p.categories, p.city, p.website, p.linkedin_url, p.photo_path)
             is distinct from
             (m.source_events, m.ctd_status, m.name, m.kind, m.company, m.job_title, m.headline, m.description,
              m.services, m.categories, m.city, m.website, m.linkedin_url, m.photo_path)
      returning p.id
    )
    select coalesce(array_agg(id), '{}') into v_updated from upd;

    select a.published, a.unpublished into v_pub, v_unpub
      from public.directory_ctd_apply(
             array(select p.id from public.directory_profiles p join ctd_src s on not s.hidden and s.email = p.email
                   union
                   select p.id from public.directory_profiles p join ctd_src s
                     on s.hidden and public.directory_email_sha256(p.email) = s.email_sha256)) a;

    v_result := jsonb_build_object(
      'rows', (select count(*) from ctd_src),
      'inserted', cardinality(v_inserted),
      'updated', (select count(*) from unnest(v_updated) id where id <> all (v_inserted)),
      'skipped', (select count(*) from ctd_src s
                   where not s.hidden and not public.directory_own_name(s.name, s.email)
                     and not exists (select 1 from public.directory_profiles p where p.email = s.email)),
      'hidden', cardinality(v_hidden),
      'published', v_pub,
      'unpublished', v_unpub,
      'dry_run', p_dry_run);

    if p_dry_run then
      raise exception using errcode = 'DRYRN';
    end if;
  exception when sqlstate 'DRYRN' then
    null; -- everything above is rolled back; v_result stays
  end;

  return v_result;
end;
$$;

create function public.directory_ctd_finish(p_seen text[], p_dry_run boolean default false)
returns jsonb
language plpgsql
set search_path = ''
as $$
declare
  v_synced integer;
  v_gone uuid[];
  v_pub integer;
  v_unpub integer;
  v_result jsonb;
begin
  select count(*) into v_synced from public.directory_profiles where ctd_status in ('imported', 'claimed');
  -- A broken export must not hide everyone: refuse a run that sees under half of what we have.
  if cardinality(coalesce(p_seen, '{}')) < v_synced / 2 then
    v_result := jsonb_build_object('refused', true, 'seen', cardinality(coalesce(p_seen, '{}')), 'synced', v_synced);
    if not p_dry_run then
      insert into public.directory_sync_state (source, last_sync_at, last_result) values ('ctd', now(), v_result)
      on conflict (source) do update set last_sync_at = excluded.last_sync_at, last_result = excluded.last_result;
    end if;
    return v_result;
  end if;

  begin
    with g as (
      update public.directory_profiles p
         set ctd_status = 'hidden'
       where p.ctd_status in ('imported', 'claimed')
         and public.directory_email_sha256(p.email) <> all (coalesce(p_seen, '{}'))
      returning p.id
    )
    select coalesce(array_agg(id), '{}') into v_gone from g;

    select a.published, a.unpublished into v_pub, v_unpub from public.directory_ctd_apply(v_gone) a;

    v_result := jsonb_build_object('seen', cardinality(coalesce(p_seen, '{}')), 'gone', cardinality(v_gone),
                                   'unpublished', v_unpub, 'dry_run', p_dry_run);
    insert into public.directory_sync_state (source, last_sync_at, last_result) values ('ctd', now(), v_result)
    on conflict (source) do update set last_sync_at = excluded.last_sync_at, last_result = excluded.last_result;

    if p_dry_run then
      raise exception using errcode = 'DRYRN';
    end if;
  exception when sqlstate 'DRYRN' then
    null;
  end;

  return v_result;
end;
$$;

-- The Luma import (unchanged otherwise): a profile claimed on cancuntech.day keeps what its owner
-- wrote there, and one hidden there is not published again by an import.
create or replace function public.directory_import_profiles(p_rows jsonb)
returns table (inserted integer, updated integer, unchanged integer, published integer)
language plpgsql
set search_path = ''
as $$
declare
  v_total integer;
  v_inserted uuid[];
  v_updated uuid[];
  v_published uuid[] := '{}';
  rec record;
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
             coalesce((select array_agg(distinct e order by e) from unnest(r.source_events) e where e is not null), '{}') as source_events,
             -- Only a row with its own name is published: the email fallback must never be public.
             coalesce(r.publish, false) and nullif(btrim(r.name), '') is not null as publish
        from jsonb_to_recordset(p_rows) as r(email text, name text, company text, job_title text,
                                             linkedin_url text, city text, company_size text, source_events text[],
                                             publish boolean)
       where lower(btrim(r.email)) ~ '^[^\s@]+@[^\s@]+\.[^\s@]{2,}$'
         and char_length(btrim(r.email)) <= 200
    ) s
   order by email, publish desc;

  select count(*) into v_total from directory_import_src;

  with ins as (
    insert into public.directory_profiles (email, name, company, job_title, linkedin_url, city, company_size, source_events)
    select s.email, s.name, s.company, s.job_title, s.linkedin_url, s.city, s.company_size, s.source_events
      from directory_import_src s
     where not exists (select 1 from public.directory_profiles p where p.email = s.email)
    returning id
  )
  select coalesce(array_agg(id), '{}') into v_inserted from ins;

  with merged as (
    select p.id,
           (select coalesce(array_agg(distinct e order by e), '{}') from unnest(p.source_events || s.source_events) e) as source_events,
           case when p.status = 'unclaimed' and p.ctd_status is distinct from 'claimed' then s.name else p.name end as name,
           case when p.status = 'unclaimed' and p.ctd_status is distinct from 'claimed' then coalesce(s.company, p.company) else p.company end as company,
           case when p.status = 'unclaimed' and p.ctd_status is distinct from 'claimed' then coalesce(s.job_title, p.job_title) else p.job_title end as job_title,
           case when p.status = 'unclaimed' and p.ctd_status is distinct from 'claimed' then coalesce(s.linkedin_url, p.linkedin_url) else p.linkedin_url end as linkedin_url,
           case when p.status = 'unclaimed' and p.ctd_status is distinct from 'claimed' then coalesce(s.city, p.city) else p.city end as city,
           -- The size is never typed by the person, so a fresh value always wins.
           coalesce(s.company_size, p.company_size) as company_size
      from public.directory_profiles p
      join directory_import_src s on s.email = p.email
  )
  , upd as (
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
         is distinct from (m.source_events, m.name, m.company, m.job_title, m.linkedin_url, m.city, m.company_size)
  returning p.id
  )
  select coalesce(array_agg(id), '{}') into v_updated from upd;
  -- Rows inserted above are matched by the update too, but they are already equal, so they never
  -- count as updated.

  -- Publish, one row at a time because each needs a free slug.
  for rec in
    select p.id, p.name, p.slug
      from public.directory_profiles p
      join directory_import_src s on s.email = p.email
     where s.publish and p.status = 'unclaimed' and not p.published
       and p.ctd_status is distinct from 'hidden'
     order by p.created_at, p.id
  loop
    update public.directory_profiles
       set slug = coalesce(rec.slug, public.directory_free_slug(rec.name, rec.id)),
           published = true
     where id = rec.id;
    v_published := v_published || rec.id;
  end loop;

  -- An existing row counts as updated when its data changed or it was published now.
  return query
    select cardinality(v_inserted),
           (select count(distinct id)::integer from unnest(v_updated || v_published) id where id <> all (v_inserted)),
           v_total - cardinality(v_inserted)
             - (select count(distinct id)::integer from unnest(v_updated || v_published) id where id <> all (v_inserted)),
           cardinality(v_published);
end;
$$;

-- directory_email_sha256 stays executable by everyone: the index above uses it.
revoke execute on function public.directory_clean_line(text, integer),
                           public.directory_own_name(text, text), public.directory_map_ctd_categories(text[]),
                           public.directory_ctd_apply(uuid[]), public.directory_ctd_sync(jsonb, boolean),
                           public.directory_ctd_finish(text[], boolean), public.directory_import_profiles(jsonb)
  from public, anon, authenticated;
-- Only the cron (service role) applies what cancuntech.day exports.
grant execute on function public.directory_clean_line(text, integer),
                          public.directory_own_name(text, text), public.directory_map_ctd_categories(text[]),
                          public.directory_ctd_apply(uuid[]), public.directory_ctd_sync(jsonb, boolean),
                          public.directory_ctd_finish(text[], boolean), public.directory_import_profiles(jsonb)
  to service_role;
