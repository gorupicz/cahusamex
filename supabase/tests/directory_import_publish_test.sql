-- Imports that publish (20261114120000_directory_import_publish.sql). Runs after
-- directory_connect_test.sql, on the same database.

create function pg_temp.check(ok boolean, what text) returns void language plpgsql as $$
begin
  if ok is not true then
    raise exception 'FAILED: %', what;
  end if;
end $$;

do $$
declare
  res record;
begin
  insert into directory_profiles (email, name, status, claimed_at, published)
  values ('dueno@bolsa.mx', 'Dueño Reclamado', 'claimed', now(), false);

  select * into res from directory_import_profiles('[
    {"email": "ana@bolsa.mx", "name": "Ana Bolsa", "job_title": "Vendedor de rentas vacacionales", "source_events": ["labolsa-mx"], "publish": true},
    {"email": "sinnombre@bolsa.mx", "source_events": ["labolsa-mx"], "publish": true},
    {"email": "privado@bolsa.mx", "name": "Privado Luma", "source_events": ["luma-mexico-hospitalidad"]},
    {"email": "dueno@bolsa.mx", "name": "Otro Nombre", "source_events": ["labolsa-mx"], "publish": true},
    {"email": "nuevo@villa.mx", "name": "Nuevo Socio", "company": "Villa", "company_size": "11-50", "source_events": ["labolsa-mx"], "publish": true}
  ]'::jsonb);
  perform pg_temp.check(res.inserted = 3 and res.updated = 2 and res.unchanged = 0 and res.published = 2,
                        format('publish counts first run: %s', res));
  perform pg_temp.check((select published and slug = 'ana-bolsa' and status = 'unclaimed' from directory_profiles where email = 'ana@bolsa.mx'),
                        'unclaimed import published with a slug');
  perform pg_temp.check((select not published and slug is null from directory_profiles where email = 'sinnombre@bolsa.mx'),
                        'a row without its own name is never published');
  perform pg_temp.check((select not published from directory_profiles where email = 'privado@bolsa.mx'), 'rows without publish stay private');
  perform pg_temp.check((select not published and name = 'Dueño Reclamado' from directory_profiles where email = 'dueno@bolsa.mx'),
                        'claimed profile is neither published nor renamed');
  perform pg_temp.check((select published and source_events = '{cena-cancun-2026,labolsa-mx}' from directory_profiles where email = 'nuevo@villa.mx'),
                        'existing unclaimed profile published and gains the source');

  select * into res from directory_import_profiles('[
    {"email": "ana@bolsa.mx", "name": "Ana Bolsa", "job_title": "Vendedor de rentas vacacionales", "source_events": ["labolsa-mx"], "publish": true},
    {"email": "privado@bolsa.mx", "name": "Privado Luma", "source_events": ["luma-mexico-hospitalidad"]}
  ]'::jsonb);
  perform pg_temp.check(res.inserted = 0 and res.updated = 0 and res.unchanged = 2 and res.published = 0,
                        format('publishing import is idempotent: %s', res));

  -- The same email twice in one batch: the row that asks to publish wins.
  select * into res from directory_import_profiles('[
    {"email": "privado@bolsa.mx", "name": "Privado Luma", "source_events": ["luma-mexico-hospitalidad"]},
    {"email": "privado@bolsa.mx", "name": "Privado Luma", "source_events": ["luma-mexico-hospitalidad"], "publish": true}
  ]'::jsonb);
  perform pg_temp.check(res.published = 1 and (select published from directory_profiles where email = 'privado@bolsa.mx'),
                        'publish wins among duplicate rows');

  perform pg_temp.check(
    (select count(*) from pg_constraint where conname = 'directory_profiles_published_has_slug') = 1,
    'published needs a slug');
  begin
    update directory_profiles set slug = null where email = 'ana@bolsa.mx';
    raise exception 'FAILED: published profile without slug accepted';
  exception when check_violation then null;
  end;
end $$;

set role anon;
do $$
begin
  perform pg_temp.check(exists (select 1 from directory_profiles where slug = 'ana-bolsa'), 'anon sees published imports');
  perform pg_temp.check(not exists (select 1 from directory_profiles where name = 'Dueño Reclamado'), 'anon does not see unpublished claimed');
  perform pg_temp.check((select status from directory_profiles where slug = 'ana-bolsa') = 'unclaimed', 'anon reads the claim status');
  begin
    perform email from directory_profiles limit 1;
    raise exception 'FAILED: anon read email';
  exception when insufficient_privilege then null;
  end;
end $$;
reset role;

\echo 'All import publish tests passed.'
