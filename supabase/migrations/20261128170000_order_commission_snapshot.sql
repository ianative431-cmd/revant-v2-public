-- Freeze the marketplace commission rate on each order at creation time.
-- Global commission changes must never rewrite the economics of existing orders.

alter table public.orders
  add column if not exists commission_rate numeric(7,4) not null default 0.5000;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.orders'::regclass
      and conname = 'orders_commission_rate_range'
  ) then
    alter table public.orders
      add constraint orders_commission_rate_range
      check (commission_rate >= 0 and commission_rate <= 100);
  end if;
end;
$$;

create or replace function private.capture_order_commission_rate()
returns trigger
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_rate numeric;
begin
  select coalesce((ss.value #>> '{}')::numeric, 0.5)
    into v_rate
  from public.system_settings ss
  where ss.key = 'revant.commission_percent';

  if not found then
    v_rate := 0.5;
  end if;

  if v_rate < 0 or v_rate > 100 then
    raise exception 'invalid_commission_rate';
  end if;

  new.commission_rate := round(v_rate, 4);
  return new;
end;
$function$;

drop trigger if exists capture_order_commission_rate on public.orders;
create trigger capture_order_commission_rate
before insert on public.orders
for each row
execute function private.capture_order_commission_rate();

create or replace function private.guard_order_commission_rate_immutable()
returns trigger
language plpgsql
set search_path to ''
as $function$
begin
  if new.commission_rate is distinct from old.commission_rate then
    raise exception 'commission_rate_immutable' using errcode = '42501';
  end if;
  return new;
end;
$function$;

drop trigger if exists guard_order_commission_rate_immutable on public.orders;
create trigger guard_order_commission_rate_immutable
before update on public.orders
for each row
execute function private.guard_order_commission_rate_immutable();

create or replace function private.release_order_finance(p_order_id uuid)
returns void
language plpgsql
security definer
set search_path to 'public', 'private'
as $function$
declare
  v_order public.orders%rowtype;
  v_payment public.payments%rowtype;
  v_rate numeric;
  v_item record;
  v_wallet public.wallets%rowtype;
  v_net numeric;
  v_commission numeric;
  v_ledger_id uuid;
begin
  select * into v_order
  from public.orders
  where id = p_order_id
  for update;

  if not found then raise exception 'order_not_found'; end if;
  if v_order.status <> 'delivered' then raise exception 'order_not_delivered'; end if;

  select * into v_payment
  from public.payments
  where order_id = p_order_id and status = 'paid'
  order by paid_at desc nulls last
  limit 1;

  if not found then raise exception 'paid_payment_not_found'; end if;

  v_rate := v_order.commission_rate;
  if v_rate is null or v_rate < 0 or v_rate > 100 then
    raise exception 'invalid_order_commission_rate';
  end if;

  for v_item in
    select oi.shop_id, s.owner_id, sum(oi.line_total) as gross
    from public.order_items oi
    join public.shops s on s.id = oi.shop_id
    where oi.order_id = p_order_id
    group by oi.shop_id, s.owner_id
  loop
    v_commission := round(v_item.gross * v_rate / 100, 2);
    v_net := v_item.gross - v_commission;

    insert into public.wallets (user_id, currency, available_balance, pending_balance, status)
    values (v_item.owner_id, v_order.currency, 0, 0, 'active')
    on conflict (user_id) do nothing;

    select * into v_wallet
    from public.wallets
    where user_id = v_item.owner_id
    for update;

    if v_wallet.currency <> v_order.currency then
      raise exception 'wallet_currency_mismatch';
    end if;

    v_ledger_id := null;
    insert into public.ledger_entries (
      wallet_id, order_id, payment_id, type, amount, currency,
      reference, description, metadata
    )
    values (
      v_wallet.id, p_order_id, v_payment.id, 'sale', v_net, v_order.currency,
      'SALE-' || p_order_id || '-' || v_item.shop_id,
      'Vente vendeur après commission Revant',
      jsonb_build_object(
        'gross', v_item.gross,
        'commission', v_commission,
        'commission_rate', v_rate
      )
    )
    on conflict (reference) do nothing
    returning id into v_ledger_id;

    if v_ledger_id is not null then
      update public.wallets
      set pending_balance = pending_balance + v_net,
          updated_at = now()
      where id = v_wallet.id;
    end if;
  end loop;
end;
$function$;

revoke all on function private.capture_order_commission_rate() from public, anon, authenticated;
revoke all on function private.guard_order_commission_rate_immutable() from public, anon, authenticated;
