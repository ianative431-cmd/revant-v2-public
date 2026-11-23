-- Persist a real courier incident reason instead of accepting a bare failed status.
-- Prepared on the feature branch only; do not apply to production until reviewed.

drop function if exists public.driver_update_delivery_status(uuid, public.delivery_status);
drop function if exists private.driver_update_delivery_status(uuid, public.delivery_status);

create or replace function private.driver_update_delivery_status(
  p_delivery_id uuid,
  p_status public.delivery_status,
  p_failure_reason text
)
returns boolean
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_uid uuid := auth.uid();
  v_driver_id uuid;
  v_current_status public.delivery_status;
  v_order_id uuid;
  v_failure_reason text := nullif(btrim(p_failure_reason), '');
  v_buyer_id uuid;
  v_order_number text;
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

  if p_status = 'failed' then
    if v_failure_reason is null or length(v_failure_reason) < 5 or length(v_failure_reason) > 500 then
      raise exception 'invalid_delivery_failure_reason';
    end if;
  elsif v_failure_reason is not null then
    raise exception 'invalid_delivery_failure_reason';
  end if;

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
      failure_reason = case when p_status = 'failed' then v_failure_reason else failure_reason end,
      picked_up_at = case when p_status = 'picked_up' then coalesce(picked_up_at, now()) else picked_up_at end,
      updated_at = now()
  where id = p_delivery_id;

  if p_status = 'picked_up' then
    update public.orders
    set status = 'shipped', updated_at = now()
    where id = v_order_id and status in ('confirmed', 'processing', 'ready_for_delivery');
    if not found then raise exception 'order_not_ready_for_delivery'; end if;
  elsif p_status = 'failed' then
    select o.buyer_id, o.order_number
      into v_buyer_id, v_order_number
    from public.orders o
    where o.id = v_order_id;

    if v_buyer_id is not null then
      insert into public.notifications(user_id, type, title, body, data)
      values (
        v_buyer_id,
        'delivery'::public.notification_type,
        'Incident de livraison signalé',
        'Un incident a été signalé pour votre commande. Revant et la boutique pourront suivre la situation.',
        jsonb_build_object('kind', 'delivery_failed', 'delivery_id', p_delivery_id, 'order_id', v_order_id, 'order_number', v_order_number)
      );
    end if;

    insert into public.notifications(user_id, type, title, body, data)
    select distinct s.owner_id,
      'delivery'::public.notification_type,
      'Incident sur une livraison',
      'Un livreur a signalé un incident concernant une commande de votre boutique.',
      jsonb_build_object('kind', 'delivery_failed', 'delivery_id', p_delivery_id, 'order_id', v_order_id, 'order_number', v_order_number)
    from public.order_items oi
    join public.shops s on s.id = oi.shop_id
    where oi.order_id = v_order_id;
  end if;

  return true;
end;
$function$;

create or replace function public.driver_update_delivery_status(
  p_delivery_id uuid,
  p_status public.delivery_status,
  p_failure_reason text
)
returns boolean
language sql
security definer
set search_path to ''
as $function$
  select private.driver_update_delivery_status(p_delivery_id, p_status, p_failure_reason);
$function$;

revoke all on function private.driver_update_delivery_status(uuid, public.delivery_status, text) from public, anon, authenticated;
revoke all on function public.driver_update_delivery_status(uuid, public.delivery_status, text) from public, anon;
grant execute on function public.driver_update_delivery_status(uuid, public.delivery_status, text) to authenticated;
