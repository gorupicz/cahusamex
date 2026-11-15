-- Profiles from cancuntech.day (20261115120000_directory_ctd_sync.sql). Runs on the same database
-- as the other tests, with emails of its own, and removes them at the end.

create function pg_temp.check(ok boolean, what text) returns void language plpgsql as $$
begin
  if ok is not true then
    raise exception 'FAILED: %', what;
  end if;
end $$;

create function pg_temp.h(p_email text) returns text language sql as $$
  select encode(sha256(convert_to(lower(btrim(p_email)), 'UTF8')), 'hex')
$$;

do $$
declare
  res jsonb;
  imp record;
  ctd_photo constant text := 'https://mmpdnezqnwcfjjguvdcw.supabase.co/storage/v1/object/public/directory-photos/abc/1.webp';
  own_photo constant text := 'https://xfkicfgxznzvuffnufts.supabase.co/storage/v1/object/public/directory-photos/own/2.webp';
begin
  -- Ours: a Luma import, published and unclaimed; one claimed here; a private draft without a name.
  insert into directory_profiles (email, slug, name, company, source_events, published, photo_path)
  values ('luma@villa.mx', 'luma-villa', 'Luma Villa', null, '{luma-mexico-hospitalidad}', true, 'own/luma.webp');
  insert into directory_profiles (email, slug, name, company, status, claimed_at, published, source_events)
  values ('dueno@villa.mx', 'dueno-villa', 'Dueño Aquí', 'Villa Propia', 'claimed', now(), true, '{labolsa-mx}');
  insert into directory_profiles (email, name, source_events) values ('borrador@villa.mx', 'borrador', '{labolsa-mx}');

  -- Dry run: counts, nothing written.
  res := directory_ctd_sync('[
    {"email": "nueva@tech.mx", "status": "unclaimed", "name": "Nueva Tech", "kind": "professional", "company": "Tech SA",
     "job_title": "CTO", "categories": ["software", "ai-data", "hospitality", "design"], "photo_url": "https://mmpdnezqnwcfjjguvdcw.supabase.co/storage/v1/object/public/directory-photos/abc/1.webp",
     "linkedin_url": "https://www.linkedin.com/in/nueva", "services": ["  Apps  ", "", "IA"]}
  ]'::jsonb, true);
  perform pg_temp.check((res->>'inserted')::int = 1 and (res->>'published')::int = 1 and (res->>'dry_run')::boolean,
                        format('dry run counts: %s', res));
  perform pg_temp.check(not exists (select 1 from directory_profiles where email = 'nueva@tech.mx'), 'dry run writes nothing');

  res := directory_ctd_sync(jsonb_build_array(
    -- New: inserted, published, tagged, photo stays a cancuntech.day URL, categories mapped.
    jsonb_build_object('email', 'Nueva@Tech.mx ', 'status', 'unclaimed', 'name', 'Nueva Tech', 'company', 'Tech SA',
                       'job_title', 'CTO', 'categories', '["software", "ai-data", "hospitality", "design"]'::jsonb,
                       'photo_url', ctd_photo, 'linkedin_url', 'https://www.linkedin.com/in/nueva',
                       'services', '["  Apps  ", "", "IA"]'::jsonb, 'whatsapp', '5219981234567'),
    -- Overlap with an unclaimed import of ours: only fills what we lack, keeps our photo.
    jsonb_build_object('email', 'luma@villa.mx', 'status', 'unclaimed', 'name', 'Otro Nombre', 'company', 'Villa Tech',
                       'photo_url', ctd_photo),
    -- Overlap with a profile claimed here: nothing but the tag and status changes.
    jsonb_build_object('email', 'dueno@villa.mx', 'status', 'claimed', 'name', 'Dueño Allá', 'company', 'Otra'),
    -- Our nameless draft: takes their name and is published.
    jsonb_build_object('email', 'borrador@villa.mx', 'status', 'unclaimed', 'name', 'Borrador Con Nombre'),
    -- A name that is only the email: not inserted.
    jsonb_build_object('email', 'juan@tech.mx', 'status', 'unclaimed', 'name', 'juan'),
    -- A photo in our own bucket becomes our path; a foreign URL is dropped.
    jsonb_build_object('email', 'propia@tech.mx', 'status', 'claimed', 'name', 'Foto Propia', 'photo_url', own_photo),
    jsonb_build_object('email', 'ajena@tech.mx', 'status', 'unclaimed', 'name', 'Foto Ajena', 'photo_url', 'https://evil.example/x.png'),
    -- Held rows are ignored here.
    jsonb_build_object('email_sha256', pg_temp.h('luma@villa.mx'), 'held', true)
  ));
  perform pg_temp.check((res->>'inserted')::int = 3 and (res->>'skipped')::int = 1 and (res->>'published')::int = 4
                        and (res->>'updated')::int = 3,
                        format('first sync counts: %s', res));

  perform pg_temp.check((select published and status = 'unclaimed' and source_events = '{cancuntechday}' and ctd_status = 'imported'
                                and photo_path = ctd_photo and categories = '{technology,hotels,other}'
                                and services = '{Apps,IA}' and whatsapp is null and slug = 'nueva-tech'
                           from directory_profiles where email = 'nueva@tech.mx'),
                        'new profile from cancuntech.day');
  perform pg_temp.check((select name = 'Luma Villa' and company = 'Villa Tech' and photo_path = 'own/luma.webp'
                                and source_events = '{cancuntechday,luma-mexico-hospitalidad}' and ctd_status = 'imported'
                           from directory_profiles where email = 'luma@villa.mx'),
                        'imported there only fills what we lack');
  perform pg_temp.check((select name = 'Dueño Aquí' and company = 'Villa Propia' and ctd_status = 'claimed'
                           from directory_profiles where email = 'dueno@villa.mx'),
                        'claimed here: theirs changes nothing');
  perform pg_temp.check((select published and name = 'Borrador Con Nombre' from directory_profiles where email = 'borrador@villa.mx'),
                        'a nameless draft of ours takes their name and is published');
  perform pg_temp.check(not exists (select 1 from directory_profiles where email = 'juan@tech.mx'), 'no profile without a name of its own');
  perform pg_temp.check((select photo_path = 'own/2.webp' and ctd_status = 'claimed' from directory_profiles where email = 'propia@tech.mx'),
                        'our own bucket URL becomes our path');
  perform pg_temp.check((select photo_path is null from directory_profiles where email = 'ajena@tech.mx'), 'foreign photo URLs are dropped');

  -- Idempotent.
  res := directory_ctd_sync(jsonb_build_array(
    jsonb_build_object('email', 'nueva@tech.mx', 'status', 'unclaimed', 'name', 'Nueva Tech', 'company', 'Tech SA',
                       'job_title', 'CTO', 'categories', '["software", "ai-data", "hospitality", "design"]'::jsonb,
                       'photo_url', ctd_photo, 'linkedin_url', 'https://www.linkedin.com/in/nueva',
                       'services', '["  Apps  ", "", "IA"]'::jsonb)));
  perform pg_temp.check((res->>'inserted')::int = 0 and (res->>'updated')::int = 0 and (res->>'published')::int = 0,
                        format('second sync changes nothing: %s', res));

  -- Claimed there: what they wrote there replaces the copy, and the Luma import keeps it.
  res := directory_ctd_sync('[{"email": "luma@villa.mx", "status": "claimed", "name": "Luma Reclamada", "kind": "company",
                               "company": "Villa Reclamada", "headline": "Rentas", "photo_url": null}]'::jsonb);
  perform pg_temp.check((select name = 'Luma Reclamada' and kind = 'company' and company = 'Villa Reclamada' and headline = 'Rentas'
                                and photo_path = 'own/luma.webp' and ctd_status = 'claimed'
                           from directory_profiles where email = 'luma@villa.mx'),
                        'claimed there replaces the copy (keeps our photo when they have none)');
  select * into imp from directory_import_profiles('[{"email": "luma@villa.mx", "name": "Luma De Nuevo", "company": "Luma Co",
                                                      "source_events": ["luma-mexico-hospitalidad"], "publish": true}]'::jsonb);
  perform pg_temp.check((select name = 'Luma Reclamada' and company = 'Villa Reclamada' from directory_profiles where email = 'luma@villa.mx'),
                        'the import does not overwrite a profile claimed there');

  -- Left there: unpublished here, unless claimed here; the import does not publish it again.
  res := directory_ctd_sync(jsonb_build_array(
    jsonb_build_object('email_sha256', pg_temp.h('nueva@tech.mx'), 'hidden', true),
    jsonb_build_object('email_sha256', pg_temp.h('dueno@villa.mx'), 'hidden', true)));
  perform pg_temp.check((res->>'hidden')::int = 2 and (res->>'unpublished')::int = 1, format('hidden counts: %s', res));
  perform pg_temp.check((select not published and ctd_status = 'hidden' from directory_profiles where email = 'nueva@tech.mx'),
                        'left there: unpublished here');
  perform pg_temp.check((select published from directory_profiles where email = 'dueno@villa.mx'), 'claimed here stays published');
  select * into imp from directory_import_profiles('[{"email": "nueva@tech.mx", "name": "Nueva Tech", "source_events": ["labolsa-mx"],
                                                      "publish": true}]'::jsonb);
  perform pg_temp.check(imp.published = 0 and (select not published from directory_profiles where email = 'nueva@tech.mx'),
                        'the import does not publish someone who left there');

  -- Back there: published again.
  res := directory_ctd_sync('[{"email": "nueva@tech.mx", "status": "unclaimed", "name": "Nueva Tech"}]'::jsonb);
  perform pg_temp.check((select published and ctd_status = 'imported' from directory_profiles where email = 'nueva@tech.mx'),
                        'back there: published again');

  -- connect_opt_out here: never published by the sync.
  update directory_profiles set published = false, connect_opt_out = true where email = 'ajena@tech.mx';
  res := directory_ctd_sync('[{"email": "ajena@tech.mx", "status": "unclaimed", "name": "Foto Ajena"}]'::jsonb);
  perform pg_temp.check((select not published from directory_profiles where email = 'ajena@tech.mx'), 'opted out here stays out');

  -- finish: the guard, then deleted there = hidden.
  res := directory_ctd_finish(array[pg_temp.h('nueva@tech.mx')]);
  perform pg_temp.check((res->>'refused')::boolean, format('finish refuses under half: %s', res));
  perform pg_temp.check((select published from directory_profiles where email = 'propia@tech.mx'), 'refused finish hides nobody');

  res := directory_ctd_finish(array[pg_temp.h('nueva@tech.mx'), pg_temp.h('luma@villa.mx'), pg_temp.h('dueno@villa.mx'),
                                    pg_temp.h('borrador@villa.mx'), pg_temp.h('ajena@tech.mx')], true);
  perform pg_temp.check((res->>'gone')::int = 1 and (select ctd_status = 'claimed' from directory_profiles where email = 'propia@tech.mx'),
                        format('finish dry run: %s', res));

  res := directory_ctd_finish(array[pg_temp.h('nueva@tech.mx'), pg_temp.h('luma@villa.mx'), pg_temp.h('dueno@villa.mx'),
                                    pg_temp.h('borrador@villa.mx'), pg_temp.h('ajena@tech.mx')]);
  perform pg_temp.check((res->>'gone')::int = 1 and (res->>'unpublished')::int = 1, format('finish: %s', res));
  perform pg_temp.check((select not published and ctd_status = 'hidden' from directory_profiles where email = 'propia@tech.mx'),
                        'deleted there: hidden and unpublished here');
  perform pg_temp.check((select last_result->>'gone' = '1' from directory_sync_state where source = 'ctd'), 'last run recorded');

  -- Photo constraint: only our paths or cancuntech.day's bucket.
  begin
    update directory_profiles set photo_path = 'https://evil.example/x.png' where email = 'nueva@tech.mx';
    raise exception 'FAILED: foreign photo URL accepted';
  exception when check_violation then null;
  end;
end $$;

-- Only the service role runs the sync.
do $$
begin
  perform pg_temp.check(not has_function_privilege('anon', 'directory_ctd_sync(jsonb, boolean)', 'execute'), 'anon cannot sync');
  perform pg_temp.check(not has_function_privilege('authenticated', 'directory_ctd_finish(text[], boolean)', 'execute'), 'authenticated cannot finish');
  perform pg_temp.check(has_function_privilege('service_role', 'directory_ctd_sync(jsonb, boolean)', 'execute'), 'service role syncs');
  perform pg_temp.check(not has_column_privilege('anon', 'directory_profiles', 'ctd_status', 'select'), 'ctd_status is private');
  perform pg_temp.check(not has_table_privilege('anon', 'directory_sync_state', 'select'), 'sync state is private');
end $$;

delete from directory_sync_state;
delete from directory_profiles where email ~ '@(villa|tech)\.mx$' and email in
  ('luma@villa.mx', 'dueno@villa.mx', 'borrador@villa.mx', 'nueva@tech.mx', 'propia@tech.mx', 'ajena@tech.mx');

do $$ begin raise notice 'All ctd sync tests passed.'; end $$;
