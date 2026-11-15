-- ============================================================================================
-- Canonical cities for /directorio (owner's request, 2026-11-15)
-- ============================================================================================
--
-- directory_profiles.city is free text ("Cancún & CDMX", "Cancunb", "Playa del Carmen, Quintana
-- Roo, México."), so the city filter listed every spelling. Same design as cancuntech.day
-- (its migration 20261115120000_directory_cities.sql), so both directories group cities alike:
--
--   * directory_cities: the canonical names (what the filter and the editor offer);
--   * directory_city_aliases: folded spelling -> canonical name, or null to drop the token
--     ("mexico", "quintana roo");
--   * directory_city_parts(city): splits on , ; / & "y" "and", trims spaces and periods, folds
--     (lowercase, no accents), maps through the aliases and the canonical names (also after
--     stripping a trailing country or state: "akumal mexico", "merida yucatan"), and returns the
--     canonical cities in order of appearance plus the tokens it could not map ("Otras");
--   * directory_profiles.cities / cities_other, kept by a trigger whenever city changes, so the
--     Luma and La Bolsa MX imports, the cancuntech.day sync and the editor are all covered. Both
--     are public: they are derived from city, which already is.
--
-- To add an alias later: insert it, then `select public.directory_recompute_cities();`.

-- Lowercase without accents: "Cancún" and "CANCUN" are the same word.
create function public.directory_fold(p_value text) returns text
language sql
immutable
parallel safe
set search_path = ''
as $$
  select translate(lower(coalesce(p_value, '')), 'áàäâãéèëêíìïîóòöôõúùüûñç', 'aaaaaeeeeiiiiooooouuuunc')
$$;

create table public.directory_cities (
  name text primary key check (char_length(name) between 2 and 60),
  sort integer not null default 100
);

comment on table public.directory_cities is
  'Canonical cities of /directorio: the city filter and the editor''s options. Public.';

create table public.directory_city_aliases (
  alias text primary key check (alias = public.directory_fold(alias) and alias <> ''),
  city text references public.directory_cities (name) on update cascade
);

comment on table public.directory_city_aliases is
  'Folded spelling (lowercase, no accents) -> canonical city; city null drops the token (a country or a state). Public.';

-- Same names and order as CITY_OPTIONS in src/lib/directory/config.ts.
insert into public.directory_cities (name, sort) values
  ('Cancún', 1), ('Playa del Carmen', 2), ('Tulum', 3), ('Puerto Morelos', 4), ('Cozumel', 5),
  ('Isla Mujeres', 6), ('Akumal', 7), ('Puerto Aventuras', 8), ('Riviera Maya', 9), ('Holbox', 10),
  ('Bacalar', 11), ('Chetumal', 12), ('Mahahual', 13), ('Mérida', 20), ('Valladolid', 21),
  ('Campeche', 22), ('CDMX', 30), ('Guadalajara', 31), ('Monterrey', 32), ('Querétaro', 33),
  ('Puebla', 34), ('Oaxaca', 35);

insert into public.directory_city_aliases (alias, city) values
  ('cancunb', 'Cancún'), ('cun', 'Cancún'), ('cancun centro', 'Cancún'), ('zona hotelera', 'Cancún'),
  ('playa', 'Playa del Carmen'), ('pdc', 'Playa del Carmen'), ('playa del carmen centro', 'Playa del Carmen'),
  ('ciudad de mexico', 'CDMX'), ('cd de mexico', 'CDMX'), ('mexico city', 'CDMX'), ('cdmx mexico', 'CDMX'),
  ('df', 'CDMX'), ('mexico df', 'CDMX'),
  ('isla mujeres quintana roo', 'Isla Mujeres'), ('akumal mexico', 'Akumal'),
  ('gdl', 'Guadalajara'), ('mty', 'Monterrey'), ('queretaro', 'Querétaro'),
  -- Countries and states on their own say nothing about the city.
  ('mexico', null), ('mx', null), ('republica mexicana', null), ('quintana roo', null), ('q roo', null),
  ('qroo', null), ('yucatan', null), ('tlaxcala', null), ('jalisco', null), ('nuevo leon', null);

alter table public.directory_cities enable row level security;
alter table public.directory_city_aliases enable row level security;
create policy directory_cities_read on public.directory_cities for select to anon, authenticated using (true);
create policy directory_city_aliases_read on public.directory_city_aliases for select to anon, authenticated using (true);
revoke all on public.directory_cities, public.directory_city_aliases from anon, authenticated;
grant select on public.directory_cities, public.directory_city_aliases to anon, authenticated;

create function public.directory_city_parts(p_city text, out cities text[], out other text[])
language sql
stable
set search_path = ''
as $$
  with tokens as (
    select btrim(t, ' .-') as raw, i
      from regexp_split_to_table(coalesce(p_city, ''), '\s*(?:,|;|/|&+|\s+y\s+|\s+and\s+)\s*') with ordinality x(t, i)
  ),
  folded as (
    select raw, i, btrim(regexp_replace(replace(public.directory_fold(raw), '.', ' '), '\s+', ' ', 'g')) as f
      from tokens
     where raw <> ''
  ),
  keyed as (
    select raw, i, f,
           btrim(regexp_replace(f, '(\s+(mexico|mx|quintana roo|q roo|qroo|yucatan|tlaxcala|jalisco|nuevo leon))+$', '')) as s
      from folded
  ),
  mapped as (
    select k.raw, k.i,
           coalesce((select a.city from public.directory_city_aliases a where a.alias = k.f),
                    (select c.name from public.directory_cities c where public.directory_fold(c.name) = k.f),
                    (select a.city from public.directory_city_aliases a where a.alias = k.s),
                    (select c.name from public.directory_cities c where public.directory_fold(c.name) = k.s)) as city,
           exists (select 1 from public.directory_city_aliases a where a.alias in (k.f, k.s) and a.city is null) as dropped
      from keyed k
  )
  select coalesce((select array_agg(city order by first)
                     from (select city, min(i) as first from mapped where city is not null group by city) c), '{}'),
         coalesce((select array_agg(raw order by first)
                     from (select left(raw, 60) as raw, min(i) as first from mapped
                            where city is null and not dropped group by 1) o), '{}')
$$;

alter table public.directory_profiles
  add column cities text[] not null default '{}',
  add column cities_other text[] not null default '{}';

comment on column public.directory_profiles.cities is 'Canonical cities parsed from city (trigger). Public.';
comment on column public.directory_profiles.cities_other is 'Parts of city that map to no canonical city: the "Otras" filter. Public.';

-- The editor composes "Cancún, Tulum, <otra>": room for several cities.
alter table public.directory_profiles drop constraint directory_profiles_city_check;
alter table public.directory_profiles add constraint directory_profiles_city_check check (char_length(city) <= 200);

create function public.directory_profiles_cities() returns trigger
language plpgsql
set search_path = ''
as $$
begin
  select p.cities, p.other into new.cities, new.cities_other from public.directory_city_parts(new.city) p;
  return new;
end;
$$;

create trigger directory_profiles_cities
  before insert or update of city on public.directory_profiles
  for each row execute function public.directory_profiles_cities();

-- After adding aliases or cities: recompute every profile. Returns how many changed.
create function public.directory_recompute_cities() returns integer
language plpgsql
set search_path = ''
as $$
declare
  v integer;
begin
  update public.directory_profiles d
     set cities = p.cities, cities_other = p.other
    from (select id, (public.directory_city_parts(city)).* from public.directory_profiles) p
   where d.id = p.id and (d.cities, d.cities_other) is distinct from (p.cities, p.other);
  get diagnostics v = row_count;
  return v;
end;
$$;

grant select (cities, cities_other) on public.directory_profiles to anon, authenticated;

revoke execute on function public.directory_fold(text), public.directory_city_parts(text),
                           public.directory_profiles_cities(), public.directory_recompute_cities()
  from public, anon, authenticated;
-- The trigger calls them as whoever writes the row (the service role, the sync functions' owner).
grant execute on function public.directory_fold(text), public.directory_city_parts(text) to anon, authenticated, service_role;
grant execute on function public.directory_recompute_cities() to service_role;

-- Backfill. Recomputing only touches cities / cities_other, so updated_at moves but nothing the
-- cancuntech.day push compares changes.
select public.directory_recompute_cities();
