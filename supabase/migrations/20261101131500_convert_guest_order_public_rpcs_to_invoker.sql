create or replace function public.create_guest_order(
  p_product_id uuid,
  p_guest_name text,
  p_guest_phone text,
  p_guest_city text,
  p_guest_address text,
  p_tracking_token_hash text,
  p_website text default '',
  p_buyer_id uuid default null
)
returns jsonb
language plpgsql
security invoker
set search_path to ''
as $function$
begin
  return private.create_guest_order_impl(
    p_product_id,p_guest_name,p_guest_phone,p_guest_city,
    p_guest_address,p_tracking_token_hash,p_website,p_buyer_id
  );
end;
$function$;

create or replace function public.get_guest_order(
  p_order_number text,
  p_tracking_token_hash text
)
returns jsonb
language sql
security invoker
set search_path to ''
as $function$
  select private.get_guest_order_impl(p_order_number,p_tracking_token_hash);
$function$;
