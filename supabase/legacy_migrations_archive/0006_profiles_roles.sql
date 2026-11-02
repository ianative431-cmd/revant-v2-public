-- Migration : fondation des rôles (profiles). Prérequis réel pour
-- toute fonctionnalité "administrateur" — sans cette table, un espace
-- admin ne pourrait être protégé que côté frontend, ce qui est
-- explicitement interdit (voir prompt maître "arrière-plans", section 8
-- et 22). Fait suite à 0005_product_images_storage.sql.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'customer' check (role in ('admin', 'seller', 'customer')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on column public.profiles.role is
  '"seller" est indicatif — l''autorisation vendeur réelle passe par la propriété d''une boutique (shops.owner_id). Seul "admin" est structurant. Attribué UNIQUEMENT en base par le service role, jamais par l''utilisateur lui-même ni via l''API publique (aucune policy d''update ci-dessous ne l''autorise).';

-- Création automatique d'un profil "customer" à chaque inscription.
create or replace function public.handle_new_user_profile()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id) values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_profile on auth.users;
create trigger on_auth_user_created_profile
  after insert on auth.users
  for each row execute function public.handle_new_user_profile();

create or replace function public.profiles_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.profiles_set_updated_at();

alter table public.profiles enable row level security;

-- Chacun lit son propre profil (savoir si on est admin, côté UI).
create policy "profiles_read_own"
on public.profiles for select
to authenticated
using (auth.uid() = id);

-- Un admin peut lire tous les profils (nécessaire pour une future
-- gestion des utilisateurs depuis l'administration).
create policy "profiles_admin_read_all"
on public.profiles for select
to authenticated
using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

-- Volontairement AUCUNE policy insert/update/delete pour "authenticated" :
-- le rôle ne peut être changé que par le service role (SQL direct dans
-- Supabase, ou futur outil serveur-à-serveur) — jamais depuis le client,
-- même par un admin via l'API publique. Cela évite qu'un compte
-- compromis (fût-il admin) puisse s'auto-promouvoir ou promouvoir un
-- complice via une requête directe à l'API.

-- Pour promouvoir le tout premier administrateur, une fois un vrai
-- projet Supabase connecté, exécuter manuellement dans le SQL Editor
-- (jamais depuis l'application) :
--   update public.profiles set role = 'admin'
--   where id = (select id from auth.users where email = 'ton-email@exemple.com');
