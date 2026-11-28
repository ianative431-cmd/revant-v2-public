-- Complete the manual payout lifecycle without pretending to initiate an external transfer.
-- An administrator can confirm a real transfer with its external reference, or record a failure
-- and return the reserved amount to the seller's available wallet balance.

create unique index if not exists payouts_provider_payout_reference_unique
on public.payouts(provider, provider_payout_id)
where provider_payout_id is not null;

create or replace function private.admin_finalize_payout(
  p_payout_id uuid,
  p_action text,
  p_transfer_reference text default null,
  p_reason text default null
)
returns void
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_admin uuid := auth.uid();
  v_payout public.payouts%rowtype;
  v_role_ok boolean;
  v_reference text;
  v_reason text;
begin
  if v_admin is null then
    raise exception 'not_authenticated';
  end if;

  select exists (
    select 1
    from public.user_roles
    where user_id = v_admin
      and role in ('super_admin','admin','finance_admin')
  ) into v_role_ok;

  if not v_role_ok then
    raise exception 'not_authorized';
  end if;

  if exists (
    select 1 from public.user_roles
    where user_id = v_admin and role = 'super_admin'
  ) then
    if (select auth.jwt() ->> 'aal') is distinct from 'aal2'
       or not private.is_current_super_admin_device_trusted() then
      raise exception 'forbidden';
    end if;
  end if;

  if p_action not in ('paid','failed') then
    raise exception 'invalid_payout_finalization_action';
  end if;

  select * into v_payout
  from public.payouts
  where id = p_payout_id
  for update;

  if not found then
    raise exception 'payout_not_found';
  end if;

  if v_payout.status not in ('approved','processing') then
    raise exception 'payout_not_finalizable';
  end if;

  if p_action = 'paid' then
    v_reference := trim(coalesce(p_transfer_reference, ''));
    if length(v_reference) < 4 or length(v_reference) > 128 then
      raise exception 'invalid_transfer_reference';
    end if;

    update public.payouts
    set status = 'paid',
        provider = 'manual',
        provider_payout_id = v_reference,
        paid_at = now(),
        failure_reason = null,
        updated_at = now()
    where id = p_payout_id;

    insert into public.admin_actions(admin_id, action, target_type, target_id, reason, metadata)
    values (
      v_admin, 'mark_paid', 'payout', p_payout_id,
      'Virement externe confirmé manuellement',
      jsonb_build_object(
        'previous_status', v_payout.status::text,
        'new_status', 'paid',
        'provider', 'manual',
        'transfer_reference', v_reference,
        'amount', v_payout.amount,
        'currency', v_payout.currency
      )
    );

    insert into public.audit_logs(actor_id, action, entity_type, entity_id, description, metadata)
    values (
      v_admin, 'update', 'payout', p_payout_id,
      'Retrait marqué payé après confirmation manuelle du transfert externe',
      jsonb_build_object(
        'transfer_reference', v_reference,
        'amount', v_payout.amount,
        'currency', v_payout.currency
      )
    );
  else
    v_reason := trim(coalesce(p_reason, ''));
    if length(v_reason) < 5 or length(v_reason) > 500 then
      raise exception 'payout_failure_reason_required';
    end if;

    update public.payouts
    set status = 'failed',
        failure_reason = v_reason,
        updated_at = now()
    where id = p_payout_id;

    update public.wallets
    set available_balance = available_balance + v_payout.amount,
        updated_at = now()
    where id = v_payout.wallet_id;

    insert into public.ledger_entries(
      wallet_id, type, amount, currency, reference, description, metadata
    )
    values (
      v_payout.wallet_id, 'adjustment', v_payout.amount, v_payout.currency,
      'PAYOUT-FAIL-' || p_payout_id,
      'Échec du transfert de retrait : fonds restitués au solde disponible',
      jsonb_build_object('payout_id', p_payout_id, 'reason', v_reason)
    )
    on conflict (reference) do nothing;

    insert into public.admin_actions(admin_id, action, target_type, target_id, reason, metadata)
    values (
      v_admin, 'mark_failed', 'payout', p_payout_id, v_reason,
      jsonb_build_object(
        'previous_status', v_payout.status::text,
        'new_status', 'failed',
        'amount_restored', v_payout.amount,
        'currency', v_payout.currency
      )
    );

    insert into public.audit_logs(actor_id, action, entity_type, entity_id, description, metadata)
    values (
      v_admin, 'update', 'payout', p_payout_id,
      'Échec du retrait enregistré et fonds restitués au vendeur',
      jsonb_build_object(
        'reason', v_reason,
        'amount_restored', v_payout.amount,
        'currency', v_payout.currency
      )
    );
  end if;
end;
$function$;

create or replace function public.admin_finalize_payout(
  p_payout_id uuid,
  p_action text,
  p_transfer_reference text default null,
  p_reason text default null
)
returns void
language sql
security definer
set search_path to ''
as $function$
  select private.admin_finalize_payout(p_payout_id, p_action, p_transfer_reference, p_reason);
$function$;

revoke all on function private.admin_finalize_payout(uuid,text,text,text) from public, anon, authenticated;
revoke all on function public.admin_finalize_payout(uuid,text,text,text) from public, anon;
grant execute on function public.admin_finalize_payout(uuid,text,text,text) to authenticated;
