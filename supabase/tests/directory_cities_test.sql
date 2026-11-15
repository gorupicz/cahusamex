-- Canonical cities (20261116120000_directory_cities.sql). Runs on the same database as the other
-- tests (it cleans up after itself).

create function pg_temp.check(ok boolean, what text) returns void language plpgsql as $$
begin
  if ok is not true then
    raise exception 'FAILED: %', what;
  end if;
end $$;

create function pg_temp.parts(p text) returns text language sql as $$
  select array_to_string(cities, '|') || ' / ' || array_to_string(other, '|') from directory_city_parts(p)
$$;

do $$
declare
  v_id uuid;
begin
  -- Parsing: the spellings the live filter listed.
  perform pg_temp.check(pg_temp.parts('Cancun') = 'Cancún / ', 'plain spelling');
  perform pg_temp.check(pg_temp.parts('CANCUN') = 'Cancún / ', 'upper case');
  perform pg_temp.check(pg_temp.parts('cancún') = 'Cancún / ', 'lower case with accent');
  perform pg_temp.check(pg_temp.parts('Cancunb') = 'Cancún / ', 'alias typo');
  perform pg_temp.check(pg_temp.parts('Cancún & CDMX') = 'Cancún|CDMX / ', 'ampersand');
  perform pg_temp.check(pg_temp.parts('CDMX & Cancún') = 'CDMX|Cancún / ', 'order of appearance');
  perform pg_temp.check(pg_temp.parts('Playa del Carmen && Cancun') = 'Playa del Carmen|Cancún / ', 'double ampersand');
  perform pg_temp.check(pg_temp.parts('Cancun, Playa del Carmen y Cozumel') = 'Cancún|Playa del Carmen|Cozumel / ', 'comma and y');
  perform pg_temp.check(pg_temp.parts('Cancún, Playa del Carmen, Mérida,Monterrey.') = 'Cancún|Playa del Carmen|Mérida|Monterrey / ',
                        'no space after a comma, trailing period');
  perform pg_temp.check(pg_temp.parts('Cancun, Playa del Carmen, Mexico') = 'Cancún|Playa del Carmen / ', 'country dropped');
  perform pg_temp.check(pg_temp.parts('Cancún, playa, Tulum , Mahahual') = 'Cancún|Playa del Carmen|Tulum|Mahahual / ', 'playa alias');
  perform pg_temp.check(pg_temp.parts('Akumal México') = 'Akumal / ', 'trailing country');
  perform pg_temp.check(pg_temp.parts('Mérida, Yucatán') = 'Mérida / ', 'state dropped');
  perform pg_temp.check(pg_temp.parts('Merida Yucatan') = 'Mérida / ', 'trailing state');
  perform pg_temp.check(pg_temp.parts('Ciudad de México') = 'CDMX / ', 'CDMX alias');
  perform pg_temp.check(pg_temp.parts('Quintana Roo') = ' / ', 'a state alone says nothing');
  perform pg_temp.check(pg_temp.parts('Huamantla, Tlaxcala') = ' / Huamantla', 'unknown city goes to other');
  perform pg_temp.check(pg_temp.parts('Cancún, Cancun') = 'Cancún / ', 'duplicates collapse');
  perform pg_temp.check(pg_temp.parts(null) = ' / ' and pg_temp.parts('') = ' / ', 'empty');

  -- The trigger keeps cities in step with city, on insert and on update.
  insert into directory_profiles (email, name, city, published, slug)
  values ('ciudad@test.mx', 'Persona Ciudad', 'Cancun, Tulum, Bacalar y Sureste', true, 'persona-ciudad')
  returning id into v_id;
  perform pg_temp.check((select cities = '{Cancún,Tulum,Bacalar}' and cities_other = '{Sureste}' from directory_profiles where id = v_id),
                        'trigger on insert');
  update directory_profiles set city = 'Playa' where id = v_id;
  perform pg_temp.check((select cities = '{"Playa del Carmen"}' and cities_other = '{}' from directory_profiles where id = v_id),
                        'trigger on update');
  update directory_profiles set city = null where id = v_id;
  perform pg_temp.check((select cities = '{}' and cities_other = '{}' from directory_profiles where id = v_id), 'city cleared');

  -- The editor's longer text fits.
  update directory_profiles set city = 'Cancún, Playa del Carmen, Tulum, Puerto Morelos, Cozumel, Otra ciudad más larga' where id = v_id;
  perform pg_temp.check((select cardinality(cities) = 5 from directory_profiles where id = v_id), 'five cities fit');

  -- A new alias, then a recompute.
  update directory_profiles set city = 'Sureste' where id = v_id;
  insert into directory_city_aliases (alias, city) values ('sureste', null);
  perform pg_temp.check(directory_recompute_cities() >= 1, 'recompute changes the profile');
  perform pg_temp.check((select cities_other = '{}' from directory_profiles where id = v_id), 'recompute applies the alias');
  perform pg_temp.check(directory_recompute_cities() = 0, 'recompute is idempotent');
  delete from directory_city_aliases where alias = 'sureste';
  delete from directory_profiles where id = v_id;
end $$;

-- What anon may read.
set role anon;
select pg_temp.check((select count(*) from directory_cities) = 22, 'anon reads the cities');
select pg_temp.check((select count(*) >= 0 from (select cities, cities_other from directory_profiles) x), 'anon reads cities columns');
reset role;

select pg_temp.check(not has_function_privilege('anon', 'directory_recompute_cities()', 'execute'), 'anon cannot recompute');

\echo 'directory_cities_test: ok'
