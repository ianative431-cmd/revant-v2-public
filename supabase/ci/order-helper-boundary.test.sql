\set ON_ERROR_STOP on
set role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000001',true);
do $block$
begin
  if private.refund_remaining_amount('50000000-0000-4000-8000-000000000001') <> 80 then
    raise exception 'buyer should see only their own remaining refund amount';
  end if;
  if not private.is_order_dispute_eligible('50000000-0000-4000-8000-000000000001') then
    raise exception 'buyer should see dispute eligibility for their order';
  end if;
  if private.refund_remaining_amount('50000000-0000-4000-8000-000000000002') is not null then
    raise exception 'buyer must not see another buyer refund amount';
  end if;
  if private.is_order_dispute_eligible('50000000-0000-4000-8000-000000000002') then
    raise exception 'buyer must not probe another order dispute eligibility';
  end if;
end;
$block$;

select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000002',true);
do $block$
begin
  if private.refund_remaining_amount('50000000-0000-4000-8000-000000000001') is not null then
    raise exception 'seller must not read buyer refund balance';
  end if;
  if not private.is_order_dispute_eligible('50000000-0000-4000-8000-000000000001') then
    raise exception 'seller should see dispute eligibility for their order';
  end if;
end;
$block$;

select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000009',true);
do $block$
begin
  if private.refund_remaining_amount('50000000-0000-4000-8000-000000000001') is not null then
    raise exception 'unrelated user must not read refund balance';
  end if;
  if private.is_order_dispute_eligible('50000000-0000-4000-8000-000000000001') then
    raise exception 'unrelated user must not probe dispute eligibility';
  end if;
end;
$block$;
reset role;
select 'order helper information is limited to order participants' as result;
