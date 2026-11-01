-- Migration : commandes (prérequis réel pour un vrai reçu d'achat).
-- Fait suite à 0010_restaurant_shop_type.sql.
--
-- Modèle validé avec Mourad : aucun fournisseur de paiement n'est
-- encore connecté (Visa/Mastercard en attente). Le paiement se fait
-- donc HORS de l'application (cash, mobile money envoyé directement au
-- vendeur) ; le vendeur, une vraie personne, confirme lui-même l'avoir
-- reçu et avoir livré. Rien n'est simulé : la commande ne devient
-- "confirmee" que par une action humaine réelle du vendeur.
--
-- product_title et price_fcfa sont volontairement dupliqués (copiés au
-- moment de la commande) : un reçu doit rester exact même si le prix
-- change plus tard. "on delete restrict" empêche par ailleurs de
-- supprimer un produit ou une boutique qui a un historique de
-- commandes réel — cohérent avec le principe général du projet de ne
-- jamais casser une donnée financière/historique.

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete restrict,
  shop_id uuid not null references public.shops(id) on delete restrict,
  buyer_id uuid not null references auth.users(id) on delete restrict,
  product_title text not null,
  shop_name text not null,
  price_fcfa integer not null check (price_fcfa > 0),
  status text not null default 'en_attente' check (status in ('en_attente', 'confirmee', 'annulee')),
  created_at timestamptz not null default now(),
  confirmed_at timestamptz
);

comment on column public.orders.product_title is
  'Copie du titre du produit au moment de la commande — un reçu doit rester exact même si l''annonce change ensuite.';
comment on column public.orders.shop_name is
  'Copie du nom de la boutique au moment de la commande — le reçu reste valide même si la boutique est renommée ou suspendue ensuite.';
comment on column public.orders.price_fcfa is
  'Copie du prix au moment de la commande, jamais recalculé depuis products — voir la même logique que color_palette_id/background_id sur shops.';
comment on column public.orders.status is
  '"en_attente" = créée par l''acheteur. "confirmee"/"annulee" = décidées UNIQUEMENT par le vendeur (voir trigger orders_protect_transitions) ; une fois sortie de "en_attente", la ligne devient immuable — intégrité du futur reçu.';

-- Un seul produit ne peut avoir qu'UNE commande "en_attente" à la fois
-- (évite que plusieurs acheteurs réservent le même article avant que
-- le vendeur ait tranché).
create unique index if not exists orders_one_pending_per_product
  on public.orders (product_id)
  where status = 'en_attente';

create index if not exists orders_buyer_idx on public.orders (buyer_id, created_at desc);
create index if not exists orders_shop_idx on public.orders (shop_id, created_at desc);

alter table public.orders enable row level security;

-- Création : uniquement pour soi-même, uniquement "en_attente", jamais
-- pour son propre produit, et le prix/titre doivent correspondre à la
-- vraie annonce active au moment de l'achat (défense en profondeur —
-- la Server Action ne fait de toute façon jamais confiance au prix
-- envoyé par le client, elle le relit depuis la base).
create policy "orders_buyer_insert"
on public.orders for insert
to authenticated
with check (
  buyer_id = auth.uid()
  and status = 'en_attente'
  and exists (
    select 1 from public.products p
    join public.shops s on s.id = p.shop_id
    where p.id = product_id
      and p.shop_id = shop_id
      and p.status = 'active'
      and p.title = product_title
      and p.price_fcfa = price_fcfa
      and s.name = shop_name
      and s.owner_id <> auth.uid()
  )
);

-- Lecture : l'acheteur voit ses commandes, le vendeur voit celles de
-- sa boutique, l'admin voit tout (supervision, section 15 "Commandes"
-- de l'espace admin).
create policy "orders_read"
on public.orders for select
to authenticated
using (
  buyer_id = auth.uid()
  or exists (select 1 from public.shops where shops.id = shop_id and shops.owner_id = auth.uid())
  or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
);

-- Modification : uniquement le vendeur de la boutique concernée (voir
-- trigger ci-dessous pour ce qu'il a le droit de changer exactement).
create policy "orders_seller_update"
on public.orders for update
to authenticated
using (exists (select 1 from public.shops where shops.id = shop_id and shops.owner_id = auth.uid()))
with check (exists (select 1 from public.shops where shops.id = shop_id and shops.owner_id = auth.uid()));

-- Aucune policy delete : une commande, une fois créée, n'est jamais
-- supprimée — c'est une pièce comptable potentielle.

create or replace function public.orders_protect_transitions()
returns trigger
language plpgsql
as $$
begin
  if old.buyer_id is distinct from new.buyer_id
    or old.product_id is distinct from new.product_id
    or old.shop_id is distinct from new.shop_id
    or old.price_fcfa is distinct from new.price_fcfa
    or old.product_title is distinct from new.product_title
    or old.shop_name is distinct from new.shop_name
    or old.created_at is distinct from new.created_at
  then
    raise exception 'Ces champs de la commande ne peuvent pas être modifiés';
  end if;

  if old.status <> 'en_attente' then
    raise exception 'Cette commande a déjà été traitée et ne peut plus être modifiée';
  end if;

  if new.status not in ('confirmee', 'annulee') then
    raise exception 'Transition de statut invalide';
  end if;

  if new.status = 'confirmee' then
    new.confirmed_at = now();
  end if;

  return new;
end;
$$;

drop trigger if exists orders_before_update on public.orders;
create trigger orders_before_update
  before update on public.orders
  for each row execute function public.orders_protect_transitions();

-- Effet de bord réel (pas simulé) : quand une commande est confirmée,
-- l'annonce correspondante passe "vendue". Exécuté dans la MÊME
-- transaction que la mise à jour de la commande (donc atomique) ; pas
-- besoin de service role, le vendeur a de toute façon déjà le droit de
-- modifier son propre produit (products_owner_update, migration 0004).
create or replace function public.orders_mark_product_sold()
returns trigger
language plpgsql
as $$
begin
  if new.status = 'confirmee' and old.status = 'en_attente' then
    update public.products set status = 'sold' where id = new.product_id;
  end if;
  return new;
end;
$$;

drop trigger if exists orders_after_confirm on public.orders;
create trigger orders_after_confirm
  after update on public.orders
  for each row execute function public.orders_mark_product_sold();
