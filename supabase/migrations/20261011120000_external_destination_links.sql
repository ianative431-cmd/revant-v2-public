-- Revant: destinations externes administrables (ex. immobilier pour la rubrique Maison).
-- Les visiteurs ne voient que les liens actifs. Aucune écriture directe via l'API publique.
create table if not exists public.external_destination_links (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(trim(title)) between 2 and 100),
  url text not null check (url ~ '^https://[^[:space:]]+$'),
  description text null check (description is null or char_length(description) <= 300),
  is_active boolean not null default true,
  sort_order integer not null default 0 check (sort_order between 0 and 10000),
  created_by uuid null references auth.users(id) on delete set null,
  updated_by uuid null references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists external_destination_links_public_order_idx
  on public.external_destination_links (sort_order asc, created_at desc)
  where is_active = true;

alter table public.external_destination_links enable row level security;

drop policy if exists external_destination_links_public_read on public.external_destination_links;
create policy external_destination_links_public_read
  on public.external_destination_links for select
  using (is_active = true);

-- Deliberately no authenticated insert/update/delete policies. Admin mutations
-- go through server actions that call requireSuperAdmin() before using service role.
