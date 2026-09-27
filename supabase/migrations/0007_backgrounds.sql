-- Migration : bibliothèque d'arrière-plans (sections 1, 4, 6, 16 du
-- prompt maître "arrière-plans"). Fait suite à 0006_profiles_roles.sql
-- (dont elle dépend pour les policies admin).

create table if not exists public.backgrounds (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  category text not null default 'autres',
  image_path text not null,
  is_active boolean not null default true,
  display_order integer not null default 0,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint backgrounds_name_length check (char_length(trim(name)) between 2 and 80)
);

comment on table public.backgrounds is
  'Bibliothèque officielle d''arrière-plans Revant. Gérée exclusivement par l''administration (voir policies ci-dessous) — jamais par un vendeur.';
comment on column public.backgrounds.category is
  'Texte libre plutôt qu''une liste fermée : l''administration peut créer de nouvelles catégories simplement en les tapant (système extensible, section 1).';

create table if not exists public.user_backgrounds (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null default 'Arrière-plan personnel',
  image_path text not null,
  created_at timestamptz not null default now(),
  constraint user_backgrounds_name_length check (char_length(trim(name)) between 1 and 80)
);

comment on table public.user_backgrounds is
  'Arrière-plans personnels importés par chaque utilisateur — jamais visibles ni gérables par un autre utilisateur (section 6 : "séparer clairement bibliothèque officielle / arrière-plans personnels").';

-- Choix d'arrière-plan de boutique : officiel OU personnel, jamais les
-- deux (contrainte ci-dessous). Le choix par produit (section 5) suit
-- la même mécanique et est prévu pour une prochaine étape.
alter table public.shops
  add column if not exists background_id uuid references public.backgrounds(id) on delete set null,
  add column if not exists personal_background_id uuid references public.user_backgrounds(id) on delete set null;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'shops_background_exclusive'
  ) then
    alter table public.shops
      add constraint shops_background_exclusive
      check (background_id is null or personal_background_id is null);
  end if;
end $$;

create or replace function public.backgrounds_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists backgrounds_updated_at on public.backgrounds;
create trigger backgrounds_updated_at
  before update on public.backgrounds
  for each row execute function public.backgrounds_set_updated_at();

alter table public.backgrounds enable row level security;
alter table public.user_backgrounds enable row level security;

-- Lecture publique des arrière-plans actifs (nécessaire pour afficher
-- l'arrière-plan choisi sur une boutique publique).
create policy "backgrounds_public_read_active"
on public.backgrounds for select
using (is_active = true);

-- Toute écriture (et la lecture des arrière-plans désactivés) réservée
-- aux administrateurs.
create policy "backgrounds_admin_all"
on public.backgrounds for all
to authenticated
using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'))
with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

-- Arrière-plans personnels : strictement privés à leur propriétaire —
-- mais le fichier reste public en lecture au niveau du Storage (voir
-- migration suivante) puisqu'il doit s'afficher sur une boutique
-- publique une fois sélectionné. "Privé" signifie ici : seul le
-- propriétaire peut le gérer/sélectionner, pas que le fichier est
-- inaccessible par son URL directe.
create policy "user_backgrounds_owner_all"
on public.user_backgrounds for all
to authenticated
using (auth.uid() = owner_id)
with check (auth.uid() = owner_id);

create index if not exists backgrounds_active_order_idx
  on public.backgrounds (display_order) where is_active = true;
create index if not exists user_backgrounds_owner_idx on public.user_backgrounds (owner_id);
