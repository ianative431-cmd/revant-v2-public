\set ON_ERROR_STOP on
create table public.orders (
  id uuid primary key,
  buyer_id uuid not null,
  seller_id uuid not null,
  total_amount numeric not null,
  status text not null
);
create table public.refunds (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id),
  amount numeric not null,
  status text not null
);
create or replace function private.is_order_buyer(p_order_id uuid)
returns boolean language sql stable security definer set search_path to ''
as $$ select exists(select 1 from public.orders o where o.id=p_order_id and o.buyer_id=auth.uid()) $$;
create or replace function private.is_order_seller(p_order_id uuid)
returns boolean language sql stable security definer set search_path to ''
as $$ select exists(select 1 from public.orders o where o.id=p_order_id and o.seller_id=auth.uid()) $$;

create or replace function private.refund_remaining_amount(p_order_id uuid)
returns numeric language sql stable security definer set search_path to ''
as $$
 select o.total_amount - coalesce((select sum(r.amount) from public.refunds r where r.order_id=o.id and r.status in ('requested','approved','processing','completed')),0)
 from public.orders o where o.id=p_order_id
$$;
create or replace function private.is_order_dispute_eligible(p_order_id uuid)
returns boolean language sql stable security definer set search_path to ''
as $$
 select exists(select 1 from public.orders o where o.id=p_order_id and o.status in ('confirmed','processing','ready_for_delivery','shipped','delivered','disputed'))
$$;

grant execute on function private.is_order_buyer(uuid),private.is_order_seller(uuid),private.refund_remaining_amount(uuid),private.is_order_dispute_eligible(uuid) to authenticated,service_role;
insert into public.orders(id,buyer_id,seller_id,total_amount,status)
values
 ('50000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000002',100,'delivered'),
 ('50000000-0000-4000-8000-000000000002','00000000-0000-4000-8000-000000000003','00000000-0000-4000-8000-000000000004',250,'pending');
insert into public.refunds(order_id,amount,status)
values ('50000000-0000-4000-8000-000000000001',20,'completed');
