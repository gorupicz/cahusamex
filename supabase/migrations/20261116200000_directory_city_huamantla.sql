-- Huamantla (Tlaxcala) joins the canonical cities (owner's request, 2026-11-16): a published
-- profile listed it, and it was the only one left under "Otras". Keep CITY_OPTIONS in
-- src/lib/directory/config.ts in step.
insert into public.directory_cities (name, sort) values ('Huamantla', 36);

select public.directory_recompute_cities();
