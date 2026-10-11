-- Keep home appliances separate from personal electronics in the public catalog.
insert into public.categories (name, slug, description, is_active, sort_order)
values ('Électroménager', 'electromenager', 'Appareils ménagers et équipements de maison, séparés des appareils électroniques personnels.', true, 10)
on conflict (slug) do nothing;
