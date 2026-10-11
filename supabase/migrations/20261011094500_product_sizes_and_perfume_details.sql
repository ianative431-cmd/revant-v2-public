-- Clothing size stock and optional perfume metadata. Existing rows remain valid.
alter table public.products add column if not exists size_stock jsonb not null default '{}'::jsonb;
alter table public.products add column if not exists brand text;
alter table public.products add column if not exists volume_ml integer;
do $$ begin
 if not exists (select 1 from pg_constraint where conname='products_size_stock_object') then alter table public.products add constraint products_size_stock_object check (jsonb_typeof(size_stock)='object'); end if;
 if not exists (select 1 from pg_constraint where conname='products_brand_length') then alter table public.products add constraint products_brand_length check (brand is null or char_length(brand)<=100); end if;
 if not exists (select 1 from pg_constraint where conname='products_volume_ml_valid') then alter table public.products add constraint products_volume_ml_valid check (volume_ml is null or volume_ml between 1 and 10000); end if;
end $$;
comment on column public.products.size_stock is 'Vêtement: taille vers quantité disponible; stock_quantity reste le total.';
comment on column public.products.brand is 'Marque du produit.';
comment on column public.products.volume_ml is 'Volume en ml, principalement pour les parfums.';
