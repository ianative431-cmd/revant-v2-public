-- Migration : type de boutique "restaurant". Fait suite à
-- 0009_product_backgrounds_and_electronique.sql.
--
-- Contrairement à "pro"/"fournisseur" (attribués uniquement par
-- l'administration), "restaurant" est un choix libre du vendeur à la
-- création de sa boutique, au même titre que "standard" — un
-- restaurant est un type de commerce ordinaire, pas un palier
-- professionnel accordé par Revant.

alter table public.shops drop constraint if exists shops_shop_type_check;
alter table public.shops add constraint shops_shop_type_check
  check (shop_type in ('standard', 'restaurant', 'pro', 'fournisseur'));

comment on column public.shops.shop_type is
  'standard/restaurant = choisis librement par le vendeur à la création. pro/fournisseur = attribués UNIQUEMENT par l''administration — voir le trigger shops_protect_admin_columns.';

-- La policy d'insertion doit autoriser 'restaurant' au même titre que
-- 'standard' (sinon un utilisateur ne pourrait jamais créer de
-- boutique de type restaurant, même en le demandant honnêtement).
drop policy if exists "shops_owner_insert" on public.shops;
create policy "shops_owner_insert"
on public.shops for insert
to authenticated
with check (
  auth.uid() = owner_id
  and shop_type in ('standard', 'restaurant')
  and status = 'active'
);

-- Le trigger shops_protect_admin_columns (0002_shops.sql) continue de
-- bloquer TOUTE modification de shop_type après création, y compris
-- standard <-> restaurant par le propriétaire lui-même : le choix se
-- fait une fois, au moment de la création de la boutique.
