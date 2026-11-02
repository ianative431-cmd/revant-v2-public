-- Secure delivery lifecycle: only assigned active drivers can advance or complete a delivery.
-- Sellers may request a driver, but cannot mark a delivery as delivered.
-- This migration is prepared for review; it is not applied to the live Supabase project here.

alter table public.deliveries
  add column if not exists requested_at timestamptz;

create index if not exists deliveries_available_requests_idx
  on public.deliveries (requested_at)
  where status = 'unassigned' and driver_id is null and requested_at is not null;

comment on column public.deliveries.requested_at is
  'Set once by the owning seller when the order is ready for driver pickup.';

-- Keep code hashes and ciphertext out of the RLS-readable deliveries table.
create table if not exists private.delivery_code_secrets (
  delivery_id uuid primary key references public.deliveries(id) on delete cascade,
  code_hash text not null check (code_hash ~ '^[0-9a-f]{64}$'),
  code_ciphertext text,
  code_hint text check (code_hint is null or code_hint ~ '^[0-9]{2}$'),
  failed_attempts integer not null default 0 check (failed_attempts >= 0),
  locked_until timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table private.delivery_code_secrets enable row level security;
revoke all on table private.delivery_code_secrets from public, anon, authenticated, service_role;

-- Preserve active legacy hashes/hints before removing them from the public table.
insert into private.delivery_code_secrets(delivery_id, code_hash, code_hint)
select id, delivery_code_hash, delivery_code_hint
from public.deliveries
where delivery_code_hash is not null
on conflict (delivery_id) do nothing;

alter table public.deliveries
  drop column if exists delivery_code_hash,
  drop column if exists delivery_code_hint;

-- All delivery writes must pass through the guarded seller/driver RPCs.
revoke insert, update, delete on public.deliveries from anon, authenticated;


-- The old seller RPC allowed a seller to set delivered directly, bypassing proof of handoff.
drop function if exists private.seller_update_delivery_status(uuid, public.delivery_status);
-- The standalone generator returned a new code to the driver and bypassed buyer proof.
drop function if exists private.generate_delivery_code(uuid);
-- This unused legacy checkout is not wired to the UI and lacks idempotency/shop checks.
revoke all on function private.checkout_create_order(jsonb, uuid, boolean) from public, anon, authenticated, service_role;

drop function if exists public.seller_request_delivery(uuid);
drop function if exists public.seller_request_delivery(uuid, uuid, text, text, text);
drop function if exists private.request_delivery_for_drivers(uuid);
drop function if exists private.request_delivery_for_drivers(uuid, uuid, text, text, text);

create or replace function private.request_delivery_for_drivers(
  p_order_id uuid,
  p_actor_id uuid,
  p_code_hash text,
  p_code_ciphertext text,
  p_code_hint text
)
returns integer
language plpgsql
security definer
set search_path to 'public', 'private'
as $function$
declare
  v_count integer := 0;
  v_order_id uuid;
  v_buyer_id uuid;
  v_order_number text;
  v_shipping_address_id uuid;
  v_guest_name text;
  v_guest_phone text;
  v_guest_address text;
  v_guest_city text;
  v_recipient_name text;
  v_address_phone text;
  v_address_line text;
  v_address_city text;
  v_shop_name text;
  v_shop_city text;
  v_shop_phone text;
  v_shop_count integer;
  v_delivery_id uuid;
begin
  if p_actor_id is null or p_code_hash is null or p_code_hash !~ '^[0-9a-f]{64}$'
     or p_code_ciphertext is null or length(p_code_ciphertext) > 1000
     or p_code_hint is null or p_code_hint !~ '^[0-9]{2}$' then
    raise exception 'invalid_delivery_code_payload';
  end if;

  select o.id, o.buyer_id, o.order_number, o.shipping_address_id,
    o.guest_name, o.guest_phone, o.guest_address, o.guest_city
  into v_order_id, v_buyer_id, v_order_number, v_shipping_address_id,
    v_guest_name, v_guest_phone, v_guest_address, v_guest_city
  from public.orders o
  where o.id = p_order_id
    and o.status = 'confirmed'
    and exists (
      select 1 from public.order_items oi
      join public.shops s on s.id = oi.shop_id
      where oi.order_id = o.id and s.owner_id = p_actor_id
    )
  for update;
  if v_order_id is null then raise exception 'order_not_ready_or_forbidden'; end if;

  select count(distinct oi.shop_id)::integer into v_shop_count
  from public.order_items oi where oi.order_id = p_order_id;
  if v_shop_count <> 1 then raise exception 'invalid_order_shop_scope'; end if;

  select s.name, s.city, s.phone into v_shop_name, v_shop_city, v_shop_phone
  from public.order_items oi
  join public.shops s on s.id = oi.shop_id
  where oi.order_id = p_order_id
  limit 1;

  if v_shipping_address_id is not null then
    select a.recipient_name, a.phone, a.address_line, a.city
    into v_recipient_name, v_address_phone, v_address_line, v_address_city
    from public.addresses a
    where a.id = v_shipping_address_id and a.user_id = v_buyer_id;
  end if;

  select d.id into v_delivery_id
  from public.deliveries d
  where d.order_id = p_order_id
  for update;

  if v_delivery_id is null then
    insert into public.deliveries(order_id, status, delivery_address, pickup_address)
    values (
      p_order_id,
      'unassigned',
      concat_ws(' · ', nullif(trim(coalesce(v_guest_name, v_recipient_name)), ''), nullif(trim(coalesce(v_guest_phone, v_address_phone)), ''), nullif(trim(coalesce(v_guest_address, v_address_line)), ''), nullif(trim(coalesce(v_guest_city, v_address_city)), '')),
      concat_ws(' · ', v_shop_name, v_shop_city, v_shop_phone)
    ) returning id into v_delivery_id;
  end if;

  if exists (
    select 1 from public.deliveries d
    where d.id = v_delivery_id
      and (d.status <> 'unassigned' or d.driver_id is not null or d.requested_at is not null)
  ) then
    raise exception 'delivery_already_requested';
  end if;

  if nullif(trim(coalesce(v_guest_name, v_recipient_name)), '') is null
     or nullif(trim(coalesce(v_guest_phone, v_address_phone)), '') is null
     or nullif(trim(coalesce(v_guest_address, v_address_line)), '') is null
     or nullif(trim(coalesce(v_guest_city, v_address_city)), '') is null then
    raise exception 'delivery_address_missing';
  end if;

  select count(*)::integer into v_count
  from public.drivers dr
  where dr.user_id is not null and dr.status = 'active';
  if v_count = 0 then raise exception 'no_active_drivers'; end if;

  update public.deliveries
  set delivery_address = concat_ws(' · ', nullif(trim(coalesce(v_guest_name, v_recipient_name)), ''), nullif(trim(coalesce(v_guest_phone, v_address_phone)), ''), nullif(trim(coalesce(v_guest_address, v_address_line)), ''), nullif(trim(coalesce(v_guest_city, v_address_city)), '')),
      pickup_address = concat_ws(' · ', v_shop_name, v_shop_city, v_shop_phone),
      requested_at = now(),
      updated_at = now()
  where id = v_delivery_id
    and status = 'unassigned'
    and driver_id is null
    and requested_at is null;
  if not found then raise exception 'delivery_already_requested'; end if;

  insert into private.delivery_code_secrets(delivery_id, code_hash, code_ciphertext, code_hint, failed_attempts, locked_until)
  values (v_delivery_id, p_code_hash, p_code_ciphertext, p_code_hint, 0, null)
  on conflict (delivery_id) do update
    set code_hash = excluded.code_hash,
        code_ciphertext = excluded.code_ciphertext,
        code_hint = excluded.code_hint,
        failed_attempts = 0,
        locked_until = null,
        updated_at = now();

  insert into public.notifications(user_id, type, title, body, data)
  select dr.user_id, 'delivery'::public.notification_type, 'Nouvelle livraison disponible',
    'Une livraison Revant est disponible. Consulte ton espace livreur pour la prendre en charge.',
    jsonb_build_object('kind', 'delivery_request', 'delivery_id', v_delivery_id, 'order_id', v_order_id)
  from public.drivers dr
  where dr.user_id is not null and dr.status = 'active';
  get diagnostics v_count = row_count;

  if v_buyer_id is not null then
    insert into public.notifications(user_id, type, title, body, data)
    values (
      v_buyer_id, 'delivery'::public.notification_type, 'Code de remise de votre commande',
      'Votre code de remise est disponible dans cette notification. Ne le communiquez au livreur qu’au moment de la remise effective.',
      jsonb_build_object('kind', 'delivery_code', 'delivery_id', v_delivery_id, 'order_id', v_order_id, 'order_number', v_order_number, 'code_ciphertext', p_code_ciphertext)
    );
  end if;

  return v_count;
end;
$function$;

create or replace function private.claim_delivery(p_delivery_id uuid)
returns jsonb
language plpgsql
security definer
set search_path to 'public', 'private'
as $function$
declare
  v_uid uuid := auth.uid();
  v_driver_id uuid;
  v_delivery public.deliveries%rowtype;
  v_buyer_id uuid;
  v_seller_id uuid;
begin
  if v_uid is null then raise exception 'not_authenticated'; end if;

  select dr.id into v_driver_id
  from public.drivers dr
  where dr.user_id = v_uid and dr.status = 'active'
  limit 1;
  if v_driver_id is null then raise exception 'active_driver_required'; end if;

  update public.deliveries d
  set driver_id = v_driver_id, status = 'assigned', assigned_at = now(), updated_at = now()
  where d.id = p_delivery_id
    and d.driver_id is null
    and d.status = 'unassigned'
    and d.requested_at is not null
    and exists (
      select 1 from public.orders o
      where o.id = d.order_id and o.status = 'confirmed'
    )
  returning d.* into v_delivery;
  if not found then raise exception 'delivery_already_claimed_or_not_ready'; end if;

  update public.notifications
  set read_at = coalesce(read_at, now())
  where user_id = v_uid
    and type = 'delivery'
    and data @> jsonb_build_object('delivery_id', p_delivery_id);

  select o.buyer_id into v_buyer_id
  from public.orders o where o.id = v_delivery.order_id;

  if v_buyer_id is not null then
    insert into public.notifications(user_id, type, title, body, data)
    values (
      v_buyer_id, 'delivery'::public.notification_type, 'Livreur assigné',
      'Un livreur a été assigné à votre commande.',
      jsonb_build_object('kind', 'delivery_assigned', 'delivery_id', p_delivery_id, 'driver_id', v_driver_id)
    );
  end if;

  for v_seller_id in
    select distinct s.owner_id
    from public.order_items oi
    join public.shops s on s.id = oi.shop_id
    where oi.order_id = v_delivery.order_id
  loop
    insert into public.notifications(user_id, type, title, body, data)
    values (
      v_seller_id, 'delivery'::public.notification_type, 'Livreur assigné',
      'Un livreur a pris en charge la livraison.',
      jsonb_build_object('kind', 'delivery_assigned', 'delivery_id', p_delivery_id, 'driver_id', v_driver_id)
    );
  end loop;

  return jsonb_build_object('delivery_id', v_delivery.id, 'driver_id', v_driver_id, 'status', v_delivery.status);
end;
$function$;

create or replace function private.driver_update_delivery_status(
  p_delivery_id uuid,
  p_status public.delivery_status
)
returns boolean
language plpgsql
security definer
set search_path to 'public', 'private'
as $function$
declare
  v_uid uuid := auth.uid();
  v_driver_id uuid;
  v_current_status public.delivery_status;
  v_order_id uuid;
begin
  if v_uid is null then raise exception 'not_authenticated'; end if;

  select dr.id into v_driver_id
  from public.drivers dr
  where dr.user_id = v_uid and dr.status = 'active'
  limit 1;
  if v_driver_id is null then raise exception 'active_driver_required'; end if;

  select d.status, d.order_id into v_current_status, v_order_id
  from public.deliveries d
  where d.id = p_delivery_id and d.driver_id = v_driver_id
  for update;
  if not found then raise exception 'delivery_not_assigned_to_driver'; end if;

  if p_status = 'picked_up' and v_current_status <> 'assigned' then
    raise exception 'invalid_delivery_transition';
  elsif p_status = 'in_transit' and v_current_status <> 'picked_up' then
    raise exception 'invalid_delivery_transition';
  elsif p_status = 'failed' and v_current_status not in ('assigned', 'picked_up', 'in_transit') then
    raise exception 'invalid_delivery_transition';
  elsif p_status not in ('picked_up', 'in_transit', 'failed') then
    raise exception 'invalid_delivery_transition';
  end if;

  update public.deliveries
  set status = p_status,
      picked_up_at = case when p_status = 'picked_up' then coalesce(picked_up_at, now()) else picked_up_at end,
      updated_at = now()
  where id = p_delivery_id;

  if p_status = 'picked_up' then
    update public.orders
    set status = 'shipped', updated_at = now()
    where id = v_order_id and status in ('confirmed', 'processing', 'ready_for_delivery');
    if not found then raise exception 'order_not_ready_for_delivery'; end if;
  end if;

  return true;
end;
$function$;

create or replace function private.confirm_delivery_code(
  p_delivery_id uuid,
  p_code text
)
returns boolean
language plpgsql
security definer
set search_path to 'public', 'private'
as $function$
declare
  v_uid uuid := auth.uid();
  v_delivery public.deliveries%rowtype;
  v_code_secret private.delivery_code_secrets%rowtype;
  v_order_status public.order_status;
  v_buyer_id uuid;
  v_order_number text;
  v_seller_id uuid;
begin
  if v_uid is null then raise exception 'not_authenticated'; end if;
  if p_code is null or p_code !~ '^[0-9]{4}([0-9]{2})?$' then
    raise exception 'invalid_delivery_code';
  end if;

  select d.* into v_delivery
  from public.deliveries d
  join public.drivers dr on dr.id = d.driver_id
  where d.id = p_delivery_id
    and dr.user_id = v_uid
    and dr.status = 'active'
  for update of d;
  if not found then raise exception 'not_delivery_driver'; end if;
  if v_delivery.status <> 'in_transit' then raise exception 'delivery_not_in_transit'; end if;

  select * into v_code_secret
  from private.delivery_code_secrets
  where delivery_id = p_delivery_id
  for update;
  if not found then raise exception 'delivery_code_not_configured'; end if;
  if v_code_secret.locked_until is not null and v_code_secret.locked_until > now() then
    raise exception 'delivery_code_locked';
  end if;

  if v_code_secret.code_hash <> encode(extensions.digest(trim(p_code), 'sha256'), 'hex') then
    update private.delivery_code_secrets
    set failed_attempts = failed_attempts + 1,
        locked_until = case
          when failed_attempts + 1 >= 5 then now() + interval '15 minutes'
          else null
        end,
        updated_at = now()
    where delivery_id = p_delivery_id;
    return false;
  end if;

  select o.status, o.buyer_id, o.order_number
    into v_order_status, v_buyer_id, v_order_number
  from public.orders o
  where o.id = v_delivery.order_id
  for update;
  if not found or v_order_status not in ('shipped', 'confirmed', 'processing', 'ready_for_delivery') then
    raise exception 'order_not_ready_for_delivery';
  end if;

  update public.deliveries
  set status = 'delivered', delivered_at = now(), updated_at = now()
  where id = p_delivery_id;

  delete from private.delivery_code_secrets where delivery_id = p_delivery_id;

  update public.orders
  set status = 'delivered', delivered_at = now(), stock_reserved = false, updated_at = now()
  where id = v_delivery.order_id;

  if v_buyer_id is not null then
    insert into public.notifications(user_id, type, title, body, data)
    values (
      v_buyer_id, 'delivery'::public.notification_type, 'Commande livrée',
      'La remise de votre commande ' || v_order_number || ' a été confirmée.',
      jsonb_build_object('kind', 'delivery_completed', 'delivery_id', p_delivery_id, 'order_id', v_delivery.order_id)
    );
  end if;

  for v_seller_id in
    select distinct s.owner_id
    from public.order_items oi
    join public.shops s on s.id = oi.shop_id
    where oi.order_id = v_delivery.order_id
  loop
    insert into public.notifications(user_id, type, title, body, data)
    values (
      v_seller_id, 'delivery'::public.notification_type, 'Commande livrée',
      'La livraison de la commande ' || v_order_number || ' a été confirmée.',
      jsonb_build_object('kind', 'delivery_completed', 'delivery_id', p_delivery_id, 'order_id', v_delivery.order_id)
    );
  end loop;

  return true;
end;
$function$;

-- Guest tracking may retrieve only an encrypted delivery code after proving the order token.
create or replace function private.get_guest_order_impl(p_order_number text, p_tracking_token_hash text)
returns jsonb
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_result jsonb;
begin
  if p_order_number is null or p_tracking_token_hash is null
     or p_tracking_token_hash !~ '^[0-9a-f]{64}$' then return null; end if;

  select jsonb_build_object(
    'order_number', o.order_number,
    'status', o.status::text,
    'total_amount', o.total_amount,
    'currency', btrim(o.currency::text),
    'product_name', oi.product_name,
    'shop_name', s.name,
    'created_at', o.created_at,
    'delivery_status', d.status::text,
    'delivery_code_ciphertext', cs.code_ciphertext,
    'delivery_code_hint', cs.code_hint
  ) into v_result
  from public.orders o
  join public.order_items oi on oi.order_id = o.id
  join public.shops s on s.id = oi.shop_id
  left join public.deliveries d on d.order_id = o.id
  left join private.delivery_code_secrets cs on cs.delivery_id = d.id
  where o.order_number = p_order_number
    and o.guest_tracking_token_hash = p_tracking_token_hash
  limit 1;
  return v_result;
end;
$function$;

-- Expose only the guarded operations through public RPCs. Private implementations
-- remain inaccessible to anon/authenticated direct calls.
revoke all on function private.request_delivery_for_drivers(uuid, uuid, text, text, text) from public, anon, authenticated;
revoke all on function private.claim_delivery(uuid) from public, anon, authenticated;
revoke all on function private.driver_update_delivery_status(uuid, public.delivery_status) from public, anon, authenticated;
revoke all on function private.confirm_delivery_code(uuid, text) from public, anon, authenticated;

create or replace function public.seller_request_delivery(
  p_order_id uuid,
  p_actor_id uuid,
  p_code_hash text,
  p_code_ciphertext text,
  p_code_hint text
)
returns integer
language sql
security definer
set search_path to ''
as $function$
  select private.request_delivery_for_drivers(p_order_id, p_actor_id, p_code_hash, p_code_ciphertext, p_code_hint);
$function$;

create or replace function public.driver_claim_delivery(p_delivery_id uuid)
returns jsonb
language sql
security definer
set search_path to ''
as $function$
  select private.claim_delivery(p_delivery_id);
$function$;

create or replace function public.driver_update_delivery_status(
  p_delivery_id uuid,
  p_status public.delivery_status
)
returns boolean
language sql
security definer
set search_path to ''
as $function$
  select private.driver_update_delivery_status(p_delivery_id, p_status);
$function$;

create or replace function public.driver_confirm_delivery_code(
  p_delivery_id uuid,
  p_code text
)
returns boolean
language sql
security definer
set search_path to ''
as $function$
  select private.confirm_delivery_code(p_delivery_id, p_code);
$function$;

create or replace function public.driver_list_available_deliveries()
returns table (
  delivery_id uuid,
  order_id uuid,
  order_number text,
  pickup_address text,
  created_at timestamptz,
  requested_at timestamptz
)
language plpgsql
security definer
set search_path to ''
as $function$
begin
  if not exists (
    select 1 from public.drivers dr
    where dr.user_id = auth.uid() and dr.status = 'active'
  ) then
    raise exception 'active_driver_required' using errcode = '42501';
  end if;

  return query
  select d.id, d.order_id, o.order_number, d.pickup_address, d.created_at, d.requested_at
  from public.deliveries d
  join public.orders o on o.id = d.order_id
  where d.status = 'unassigned'
    and d.driver_id is null
    and d.requested_at is not null
    and o.status = 'confirmed'
  order by d.requested_at asc
  limit 50;
end;
$function$;

create or replace function public.driver_list_assigned_deliveries()
returns table (
  delivery_id uuid,
  order_id uuid,
  order_number text,
  status public.delivery_status,
  pickup_address text,
  delivery_address text,
  delivery_code_hint text,
  assigned_at timestamptz,
  picked_up_at timestamptz,
  delivered_at timestamptz,
  failure_reason text,
  created_at timestamptz
)
language plpgsql
security definer
set search_path to ''
as $function$
begin
  if not exists (
    select 1 from public.drivers dr
    where dr.user_id = auth.uid() and dr.status = 'active'
  ) then
    raise exception 'active_driver_required' using errcode = '42501';
  end if;

  return query
  select d.id, d.order_id, o.order_number, d.status, d.pickup_address,
    d.delivery_address, cs.code_hint, d.assigned_at, d.picked_up_at,
    d.delivered_at, d.failure_reason, d.created_at
  from public.deliveries d
  join public.drivers dr on dr.id = d.driver_id
  join public.orders o on o.id = d.order_id
  left join private.delivery_code_secrets cs on cs.delivery_id = d.id
  where dr.user_id = auth.uid()
    and dr.status = 'active'
    and d.status in ('assigned', 'picked_up', 'in_transit', 'failed')
  order by d.assigned_at desc nulls last
  limit 50;
end;
$function$;

revoke all on function public.seller_request_delivery(uuid, uuid, text, text, text) from public, anon, authenticated;
grant execute on function public.seller_request_delivery(uuid, uuid, text, text, text) to service_role;
revoke all on function public.driver_claim_delivery(uuid) from public, anon;
revoke all on function public.driver_update_delivery_status(uuid, public.delivery_status) from public, anon;
revoke all on function public.driver_confirm_delivery_code(uuid, text) from public, anon;
revoke all on function public.driver_list_available_deliveries() from public, anon;
revoke all on function public.driver_list_assigned_deliveries() from public, anon;
grant execute on function public.driver_claim_delivery(uuid) to authenticated;
grant execute on function public.driver_update_delivery_status(uuid, public.delivery_status) to authenticated;
grant execute on function public.driver_confirm_delivery_code(uuid, text) to authenticated;
grant execute on function public.driver_list_available_deliveries() to authenticated;
grant execute on function public.driver_list_assigned_deliveries() to authenticated;
