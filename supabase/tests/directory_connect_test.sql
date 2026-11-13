-- Tests for supabase/migrations/20261113120000_directory_connect.sql on a local Postgres.
-- Run with scripts/test-migrations.sh. Each block raises (and stops the run) on a failed check.
\set ON_ERROR_STOP on
set client_min_messages = warning;

-- A helper: run a statement and return the error message it raised ('' when it didn't raise).
create function pg_temp.err(p_sql text) returns text language plpgsql as $$
begin
  execute p_sql;
  return '';
exception when others then
  return sqlerrm;
end;
$$;

create function pg_temp.check(p_ok boolean, p_what text) returns void language plpgsql as $$
begin
  if not coalesce(p_ok, false) then
    raise exception 'FAILED: %', p_what;
  end if;
  raise notice 'ok: %', p_what;
end;
$$;

set client_min_messages = notice;

-- ---------- fixtures ----------
-- R and C work at Acme (same corporate domain), G is at Acme too but with a Gmail address.
insert into directory_profiles (id, email, name, company, status, claimed_at) values
  ('00000000-0000-0000-0000-0000000000a1', 'rosa@acme.mx', 'Rosa Pérez', 'Acme S.A. de C.V.', 'claimed', now()),
  ('00000000-0000-0000-0000-0000000000a2', 'carlos@acme.mx', 'Carlos Ruiz', 'Otra cosa', 'claimed', now()),
  ('00000000-0000-0000-0000-0000000000a3', 'gina@gmail.com', 'Gina Soto', 'ACME', 'claimed', now()),
  ('00000000-0000-0000-0000-0000000000a4', 'solo@gmail.com', 'Solo Uno', 'Independiente', 'claimed', now());
insert into directory_profiles (id, email, name, company, job_title)
select ('00000000-0000-0000-0000-0000000001' || lpad(i::text, 2, '0'))::uuid,
       'm' || i || '@hotel' || i || '.mx', 'Match ' || i, 'Hotel ' || i, 'Director'
  from generate_series(1, 20) i;
insert into directory_profiles (id, email, name, status, claimed_at, published, slug) values
  ('00000000-0000-0000-0000-0000000000b1', 'pub@villas.mx', 'Pública Villas', 'claimed', now(), true, 'publica-villas');

-- A search with matches 1..n for a requester.
create function pg_temp.search(p_requester uuid, p_icp text, p_from int, p_to int) returns uuid language sql as $$
  insert into connect_searches (requester_id, icp, results)
  select p_requester, p_icp,
         jsonb_agg(jsonb_build_object('id', ('00000000-0000-0000-0000-0000000001' || lpad(i::text, 2, '0'))::uuid, 'score', 90))
    from generate_series(p_from, p_to) i
  returning id
$$;
create function pg_temp.m(i int) returns uuid language sql immutable as $$
  select ('00000000-0000-0000-0000-0000000001' || lpad(i::text, 2, '0'))::uuid
$$;

do $$
declare
  r constant uuid := '00000000-0000-0000-0000-0000000000a1';
  c constant uuid := '00000000-0000-0000-0000-0000000000a2';
  g constant uuid := '00000000-0000-0000-0000-0000000000a3';
  s1 uuid;
  s2 uuid;
  n int;
begin
  -- Organization helpers
  perform pg_temp.check(connect_org_domain('x@acme.mx') = 'acme.mx', 'corporate domain kept');
  perform pg_temp.check(connect_org_domain('x@gmail.com') is null, 'personal provider ignored');
  perform pg_temp.check(connect_org_company('Acme S.A. de C.V.') = connect_org_company('acme'), 'legal suffix ignored');
  perform pg_temp.check(connect_org_company('Independiente') is null, 'placeholder company ignored');

  -- Starter: 3 free intros per organization
  s1 := pg_temp.search(r, 'Directores de hoteles boutique en Tulum', 1, 5);
  select count(*) into n from connect_reserve_intros(r, s1, array[pg_temp.m(1), pg_temp.m(2)]);
  perform pg_temp.check(n = 2, 'starter reserves 2 intros');
  perform pg_temp.check(connect_free_used(r) = 2, 'free used counts own intros');
  perform pg_temp.check(connect_free_used(c) = 2, 'free used is shared by the corporate domain');
  perform pg_temp.check(connect_free_used(g) = 2, 'free used is shared by the company name (gmail colleague)');

  s2 := pg_temp.search(c, 'Gerentes de operaciones de rentas vacacionales', 6, 10);
  perform pg_temp.check(pg_temp.err(format('select connect_reserve_intros(%L, %L, array[%L, %L]::uuid[])', c, s2, pg_temp.m(6), pg_temp.m(7))) = 'free_limit',
                        'colleague refused when the org has fewer free intros left than asked');
  select count(*) into n from connect_reserve_intros(c, s2, array[pg_temp.m(6)]);
  perform pg_temp.check(n = 1, 'colleague takes the last free intro');
  perform pg_temp.check(pg_temp.err(format('select connect_reserve_intros(%L, %L, array[%L]::uuid[])', r, s1, pg_temp.m(3))) = 'free_limit',
                        'org free intros used up');

  -- A pair is introduced only once, a match outside the search is skipped
  select count(*) into n from connect_reserve_intros(r, s1, array[pg_temp.m(1)]);
  perform pg_temp.check(n = 0, 'already introduced pair skipped');
  select count(*) into n from connect_reserve_intros(r, s1, array[pg_temp.m(15)]);
  perform pg_temp.check(n = 0, 'match outside the search skipped');

  -- An expired or foreign search
  perform pg_temp.check(pg_temp.err(format('select connect_reserve_intros(%L, %L, array[%L]::uuid[])', r, s2, pg_temp.m(8))) = 'search_expired',
                        'someone else''s search refused');
end $$;

-- Plans, ICPs and the daily limit
do $$
declare
  r constant uuid := '00000000-0000-0000-0000-0000000000a1';
  s uuid;
  n int;
  plan text;
begin
  perform pg_temp.check(connect_icp_limit('starter') = 1 and connect_icp_limit('business') = 3 and connect_icp_limit('business_plus') = 5, 'icp limits');
  perform pg_temp.check((select count(*) from connect_icps where profile_id = r) = 1, 'starter used its 1 ICP');
  perform pg_temp.check(connect_icp_allowed(r, '  directores de HOTELES boutique   en Tulum'), 'same ICP ignoring case and spaces is allowed');
  perform pg_temp.check(not connect_icp_allowed(r, 'Otra descripción de cliente ideal distinta'), 'new ICP refused at the starter limit');

  insert into connect_subscriptions (stripe_subscription_id, profile_id, plan, status) values ('sub_1', r, 'business', 'active');
  plan := connect_apply_plan(r);
  perform pg_temp.check(plan = 'business' and (select featured from directory_profiles where id = r) = false, 'business plan applied, not featured');

  s := pg_temp.search(r, 'Segundo ICP: administradores de propiedades', 11, 13);
  select count(*) into n from connect_reserve_intros(r, s, array[pg_temp.m(11)]);
  perform pg_temp.check(n = 1, 'business: second ICP sends');
  s := pg_temp.search(r, 'Tercer ICP: desarrolladores inmobiliarios', 12, 14);
  select count(*) into n from connect_reserve_intros(r, s, array[pg_temp.m(12)]);
  perform pg_temp.check(n = 1, 'business: third ICP sends');
  s := pg_temp.search(r, 'Cuarto ICP: agencias de marketing turístico', 13, 16);
  perform pg_temp.check(pg_temp.err(format('select connect_reserve_intros(%L, %L, array[%L]::uuid[])', r, s, pg_temp.m(13))) = 'icp_limit',
                        'business: fourth ICP refused');
  perform pg_temp.check((select count(*) from connect_icps where profile_id = r) = 3, 'a refused ICP is not stored');

  -- Released when nothing went out
  insert into connect_icps (id, profile_id, icp, icp_key) values ('00000000-0000-0000-0000-00000000ee01', r, 'ICP huérfano sin intros enviadas', 'icp huérfano sin intros enviadas');
  perform connect_release_icp('00000000-0000-0000-0000-00000000ee01');
  perform pg_temp.check(not exists (select 1 from connect_icps where id = '00000000-0000-0000-0000-00000000ee01'), 'unused ICP released');

  -- Daily limit: 10 per day (r already has 2 + 1 + 1 = 4 today)
  s := pg_temp.search(r, 'Segundo ICP: administradores de propiedades', 1, 20);
  perform pg_temp.check(pg_temp.err(format('select connect_reserve_intros(%L, %L, array[%L, %L, %L, %L, %L, %L, %L]::uuid[])', r, s,
                          pg_temp.m(14), pg_temp.m(15), pg_temp.m(16), pg_temp.m(17), pg_temp.m(18), pg_temp.m(19), pg_temp.m(20))) = 'daily_limit',
                        'daily limit refuses the whole request');
  perform pg_temp.check((select count(*) from connect_intros where requester_id = r) = 4, 'nothing reserved on daily_limit');
  select count(*) into n from connect_reserve_intros(r, s, array[pg_temp.m(14), pg_temp.m(15), pg_temp.m(16), pg_temp.m(17), pg_temp.m(18), pg_temp.m(19)]);
  perform pg_temp.check(n = 6, 'paid plan sends up to the daily limit');

  -- Opt-out is skipped
  update directory_profiles set connect_opt_out = true where id = pg_temp.m(20);
  update connect_intros set created_at = now() - interval '2 days' where requester_id = r;
  select count(*) into n from connect_reserve_intros(r, s, array[pg_temp.m(20)]);
  perform pg_temp.check(n = 0, 'opted-out match skipped');

  -- Downgrade: subscription ends, back to starter; used ICPs stay usable
  update connect_subscriptions set status = 'canceled' where stripe_subscription_id = 'sub_1';
  perform pg_temp.check(connect_apply_plan(r) = 'starter', 'cancelled subscription drops to starter');
  perform pg_temp.check(connect_icp_allowed(r, 'Tercer ICP: desarrolladores inmobiliarios'), 'used ICP still allowed after downgrade');

  insert into connect_subscriptions (stripe_subscription_id, profile_id, plan, status) values ('sub_2', r, 'business_plus', 'active');
  plan := connect_apply_plan(r);
  perform pg_temp.check(plan = 'business_plus' and (select featured from directory_profiles where id = r), 'business plus is featured');
end $$;

-- Direct intros
do $$
declare
  a constant uuid := '00000000-0000-0000-0000-0000000000a4';
  p constant uuid := '00000000-0000-0000-0000-0000000000b1';
  id uuid;
begin
  id := connect_reserve_direct_intro(a, p);
  perform pg_temp.check(id is not null, 'direct intro to a published profile');
  perform pg_temp.check(connect_reserve_direct_intro(a, p) is null, 'direct intro only once per pair');
  perform pg_temp.check(pg_temp.err(format('select connect_reserve_direct_intro(%L, %L)', a, a)) = 'self_intro', 'no intro to oneself');
  perform pg_temp.check(pg_temp.err(format('select connect_reserve_direct_intro(%L, %L)', a, pg_temp.m(1))) = 'not_found', 'only published profiles');
  perform pg_temp.check(pg_temp.err(format('select connect_reserve_direct_intro(%L, %L)', pg_temp.m(2), p)) = 'no_profile', 'requester must be claimed');
end $$;

-- Import: idempotent, never overwrites what a person wrote
do $$
declare
  res record;
begin
  select * into res from directory_import_profiles('[
    {"email": "Nuevo@Villa.mx ", "name": "Nuevo Socio", "company": "Villa", "company_size": "11-50", "source_events": ["cena-cancun-2026"]},
    {"email": "rosa@acme.mx", "name": "R. P.", "company": "Cambiada", "source_events": ["cena-cancun-2026"]},
    {"email": "no-es-correo", "name": "X"}
  ]'::jsonb);
  perform pg_temp.check(res.inserted = 1 and res.updated = 1 and res.unchanged = 0, 'import counts first run');
  perform pg_temp.check((select name from directory_profiles where email = 'rosa@acme.mx') = 'Rosa Pérez', 'claimed name kept');
  perform pg_temp.check((select source_events from directory_profiles where email = 'rosa@acme.mx') = '{cena-cancun-2026}', 'claimed gains source events');
  perform pg_temp.check((select company_size from directory_profiles where email = 'nuevo@villa.mx') = '11-50', 'company size imported');
  select * into res from directory_import_profiles('[
    {"email": "nuevo@villa.mx", "name": "Nuevo Socio", "company": "Villa", "company_size": "11-50", "source_events": ["cena-cancun-2026"]},
    {"email": "rosa@acme.mx", "name": "R. P.", "company": "Cambiada", "source_events": ["cena-cancun-2026"]}
  ]'::jsonb);
  perform pg_temp.check(res.inserted = 0 and res.updated = 0 and res.unchanged = 2, 'import is idempotent');
  perform pg_temp.check(directory_free_slug('Pública Villas', gen_random_uuid()) = 'publica-villas-2', 'free slug avoids collisions');
  perform pg_temp.check(directory_free_slug('Editar', gen_random_uuid()) = 'editar-2', 'reserved slug skipped');
end $$;

-- What anon can see
update directory_profiles
   set linkedin_url = 'https://www.linkedin.com/in/publica', whatsapp = '529981234567'
 where slug = 'publica-villas';

set role anon;
do $$
begin
  perform pg_temp.check((select count(*) from directory_profiles) = 1, 'anon sees published profiles only');
  perform pg_temp.check(pg_temp.err('select email from directory_profiles') like 'permission denied%', 'anon cannot read email');
  perform pg_temp.check(pg_temp.err('select linkedin_url from directory_profiles') like 'permission denied%', 'anon cannot read linkedin');
  perform pg_temp.check(pg_temp.err('select * from connect_intros') like 'permission denied%', 'anon cannot read intros');
  perform pg_temp.check(pg_temp.err('select connect_free_used(gen_random_uuid())') like 'permission denied%', 'anon cannot call limit functions');
  perform pg_temp.check(not exists (select 1 from directory_public_contact('publica-villas')), 'contact hidden on starter');
end $$;
reset role;

update directory_profiles set plan = 'business', show_contact = true where slug = 'publica-villas';
set role anon;
do $$
begin
  perform pg_temp.check((select whatsapp from directory_public_contact('publica-villas')) = '529981234567', 'contact shown for a paid member who opted in');
end $$;
reset role;

\echo 'All directory/connect tests passed.'
