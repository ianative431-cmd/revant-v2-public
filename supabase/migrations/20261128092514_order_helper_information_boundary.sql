-- These SECURITY DEFINER helpers are used by RLS policies. Keep EXECUTE
-- available, but make their answers meaningful only to an order participant.

create or replace function private.refund_remaining_amount(p_order_id uuid)
returns numeric
language sql
stable
security definer
set search_path to ''
as $function$
  select o.total_amount - coalesce((
    select sum(r.amount)
    from public.refunds r
    where r.order_id = o.id
      and r.status in ('requested', 'approved', 'processing', 'completed')
  ), 0)
  from public.orders o
  where o.id = p_order_id
    and private.is_order_buyer(o.id);
$function$;

create or replace function private.is_order_dispute_eligible(p_order_id uuid)
returns boolean
language sql
stable
security definer
set search_path to ''
as $function$
  select exists (
    select 1
    from public.orders o
    where o.id = p_order_id
      and (private.is_order_buyer(o.id) or private.is_order_seller(o.id))
      and o.status in (
        'confirmed',
        'processing',
        'ready_for_delivery',
        'shipped',
        'delivered',
        'disputed'
      )
  );
$function$;
