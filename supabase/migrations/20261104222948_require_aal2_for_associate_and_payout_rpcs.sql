-- Close remaining Super Admin aal1 paths in the associate-role and payout routines.
-- Non-super-admin finance/admin roles retain their existing permissions.

create or replace function public.admin_set_associate_role(p_user_id uuid, p_enabled boolean, p_note text default null)
returns void
language plpgsql
security definer
set search_path to ''
as $function$
begin
  if auth.uid() is null
     or not exists (
       select 1
       from public.user_roles
       where user_id = auth.uid()
         and role = 'super_admin'::public.user_role
     )
     or (select auth.jwt() ->> 'aal') is distinct from 'aal2' then
    raise exception 'forbidden';
  end if;

  perform private.admin_set_associate_role(p_user_id, p_enabled, p_note);
end;
$function$;

create or replace function private.admin_set_associate_role(p_user_id uuid, p_enabled boolean, p_note text default null)
returns void
language plpgsql
security definer
set search_path to 'public', 'private'
as $function$
declare
  changed boolean := false;
begin
  if auth.uid() is null
     or not exists (
       select 1 from public.user_roles
       where user_id = auth.uid()
         and role = 'super_admin'::public.user_role
     )
     or (select auth.jwt() ->> 'aal') is distinct from 'aal2' then
    raise exception 'forbidden';
  end if;

  if p_note is not null and length(trim(p_note)) > 500 then
    raise exception 'note_too_long';
  end if;

  if not exists (select 1 from auth.users where id = p_user_id) then
    raise exception 'user_not_found';
  end if;

  if p_enabled then
    insert into public.user_roles(user_id, role)
    values (p_user_id, 'associate'::public.user_role)
    on conflict (user_id, role) do nothing;
    changed := found;
  else
    delete from public.user_roles
    where user_id = p_user_id and role = 'associate'::public.user_role;
    changed := found;
  end if;

  if not changed then return; end if;

  insert into public.admin_actions(admin_id, action, target_type, target_id, reason, metadata)
  values (
    auth.uid(),
    case when p_enabled then 'grant_associate' else 'revoke_associate' end,
    'user',
    p_user_id,
    nullif(trim(p_note), ''),
    jsonb_build_object('role', 'associate', 'enabled', p_enabled)
  );

  insert into public.audit_logs(actor_id, action, entity_type, entity_id, description, metadata)
  values (
    auth.uid(),
    'role_change'::public.audit_action,
    'user',
    p_user_id,
    case when p_enabled then 'Associate access granted' else 'Associate access revoked' end,
    jsonb_build_object('role', 'associate', 'enabled', p_enabled)
  );
end;
$function$;

create or replace function private.admin_update_payout(p_payout_id uuid, p_action text, p_reason text default null)
returns void
language plpgsql
security definer
set search_path to 'public', 'private'
as $function$
declare
  v_admin uuid := auth.uid();
  v_payout public.payouts%rowtype;
  v_role_ok boolean;
begin
  if v_admin is null then raise exception 'not_authenticated'; end if;

  select exists(
    select 1 from public.user_roles
    where user_id = v_admin
      and role in ('super_admin','admin','finance_admin')
  ) into v_role_ok;

  if not v_role_ok then raise exception 'not_authorized'; end if;

  if exists (
    select 1 from public.user_roles
    where user_id = v_admin and role = 'super_admin'
  ) and (select auth.jwt() ->> 'aal') is distinct from 'aal2' then
    raise exception 'forbidden';
  end if;

  if p_action not in ('approve','reject') then raise exception 'invalid_action'; end if;

  select * into v_payout from public.payouts where id = p_payout_id for update;
  if not found then raise exception 'payout_not_found'; end if;
  if v_payout.status <> 'pending' then raise exception 'payout_not_pending'; end if;

  if p_action = 'approve' then
    update public.payouts set status = 'approved', approved_at = now(), updated_at = now() where id = p_payout_id;
    insert into public.admin_actions (admin_id, action, target_type, target_id, reason, metadata)
    values (v_admin, 'approve', 'payout', p_payout_id, p_reason, jsonb_build_object('previous_status','pending','new_status','approved'));
    insert into public.audit_logs (actor_id, action, entity_type, entity_id, description, metadata)
    values (v_admin, 'approve', 'payout', p_payout_id, 'Payout approuvé par un administrateur', jsonb_build_object('reason', p_reason));
  else
    update public.payouts
    set status = 'rejected', failure_reason = coalesce(p_reason, 'Rejeté par un administrateur'), updated_at = now()
    where id = p_payout_id;

    update public.wallets
    set available_balance = available_balance + v_payout.amount, updated_at = now()
    where id = v_payout.wallet_id;

    insert into public.ledger_entries (wallet_id, type, amount, currency, reference, description, metadata)
    values (
      v_payout.wallet_id, 'adjustment', v_payout.amount, v_payout.currency,
      'PAYOUT-REJECT-' || p_payout_id,
      'Retrait rejeté : fonds restitués au solde disponible',
      jsonb_build_object('payout_id', p_payout_id, 'reason', p_reason)
    )
    on conflict (reference) do nothing;

    insert into public.admin_actions (admin_id, action, target_type, target_id, reason, metadata)
    values (v_admin, 'reject', 'payout', p_payout_id, p_reason, jsonb_build_object('previous_status','pending','new_status','rejected'));
    insert into public.audit_logs (actor_id, action, entity_type, entity_id, description, metadata)
    values (v_admin, 'reject', 'payout', p_payout_id, 'Payout rejeté par un administrateur', jsonb_build_object('reason', p_reason));
  end if;
end;
$function$;
