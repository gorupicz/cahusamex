-- ============================================================================================
-- Imported profiles that are published without being claimed (owner's decision, 2026-11-14)
-- ============================================================================================
--
-- Until now a profile was public only once its owner claimed and published it. The owner decided
-- that Luma calendar subscribers and La Bolsa MX users are imported already published (like
-- Crunchbase: public from day one, claimed later), so:
--
-- * a published profile only needs a slug (it no longer has to be claimed);
-- * directory_import_profiles() takes an optional "publish": true per row. Such a row, when it
--   carries its own name (never the email fallback) and the profile is still unclaimed, gets a
--   slug and is published. Claimed profiles are never published or unpublished by the import,
--   and the import never unpublishes anything.

alter table public.directory_profiles drop constraint directory_profiles_published_is_claimed;
alter table public.directory_profiles
  add constraint directory_profiles_published_has_slug check (not published or slug is not null);

-- Public pages show "¿Eres tú? Reclama este perfil" on profiles nobody has claimed yet, so the
-- claim status becomes a public column (it says nothing about the person beyond that).
grant select (status) on public.directory_profiles to anon, authenticated;

comment on table public.directory_profiles is
  'cahusa.mx/directorio. Imported from Luma and La Bolsa MX as unclaimed profiles, private unless the import was told to publish them (Luma calendar, La Bolsa MX). Writes: service role via /api/directorio/*.';

-- The result gains a "published" count, so the function is dropped and created again.
drop function public.directory_import_profiles(jsonb);

create function public.directory_import_profiles(p_rows jsonb)
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

revoke execute on function public.directory_import_profiles(jsonb) from public, anon, authenticated;
grant execute on function public.directory_import_profiles(jsonb) to service_role;
