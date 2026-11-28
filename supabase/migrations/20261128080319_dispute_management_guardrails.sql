-- Restrict formal disputes to meaningful order states and one case per order.
-- Decision actions require an assigned support agent and an auditable resolution note.

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
      and o.status in (
        'confirmed'::public.order_status,
        'processing'::public.order_status,
        'ready_for_delivery'::public.order_status,
        'shipped'::public.order_status,
        'delivered'::public.order_status,
        'disputed'::public.order_status
      )
  );
$function$;

revoke all on function private.is_order_dispute_eligible(uuid) from public, anon;
grant execute on function private.is_order_dispute_eligible(uuid) to authenticated, service_role;

alter table public.disputes
  drop constraint if exists disputes_reason_length_check,
  drop constraint if exists disputes_description_length_check,
  drop constraint if exists disputes_resolution_note_length_check;

alter table public.disputes
  add constraint disputes_reason_length_check
    check (char_length(trim(reason)) between 3 and 120),
  add constraint disputes_description_length_check
    check (description is null or char_length(trim(description)) between 10 and 3000),
  add constraint disputes_resolution_note_length_check
    check (resolution_note is null or char_length(trim(resolution_note)) between 10 and 1000);

create unique index if not exists disputes_one_per_order_uidx
  on public.disputes(order_id);

create index if not exists disputes_status_created_idx
  on public.disputes(status, created_at desc);

create index if not exists disputes_assigned_status_created_idx
  on public.disputes(assigned_to, status, created_at desc);

drop policy if exists "order participants can create disputes" on public.disputes;
create policy "eligible order participants can create disputes"
  on public.disputes
  for insert
  to authenticated
  with check (
    opened_by = (select auth.uid())
    and status = 'open'::public.dispute_status
    and assigned_to is null
    and resolved_at is null
    and resolution_note is null
    and private.is_order_dispute_eligible(order_id)
    and (
      private.is_order_buyer(order_id)
      or private.is_order_seller(order_id)
    )
  );

create or replace function private.admin_update_dispute(
  p_dispute_id uuid,
  p_action text,
  p_note text default null
)
returns void
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_actor uuid := auth.uid();
  v_can_manage_all boolean;
  v_dispute public.disputes%rowtype;
  v_next_status public.dispute_status;
  v_note text := nullif(trim(p_note), '');
begin
  if v_actor is null or not public.current_user_has_permission('support.manage') then
    raise exception 'forbidden';
  end if;

  v_can_manage_all := public.current_user_has_permission('users.manage');

  select *
  into v_dispute
  from public.disputes
  where id = p_dispute_id
  for update;

  if not found then
    raise exception 'dispute_not_found';
  end if;

  if p_action = 'review' then
    if v_dispute.status not in (
      'open'::public.dispute_status,
      'under_review'::public.dispute_status
    ) then
      raise exception 'invalid_dispute_transition';
    end if;

    if v_dispute.assigned_to is not null
       and v_dispute.assigned_to <> v_actor
       and not v_can_manage_all then
      raise exception 'dispute_assigned_to_another_agent';
    end if;

    v_next_status := 'under_review'::public.dispute_status;

  elsif p_action in ('buyer', 'seller', 'reject') then
    if v_dispute.status not in (
      'open'::public.dispute_status,
      'under_review'::public.dispute_status
    ) then
      raise exception 'invalid_dispute_transition';
    end if;

    if v_dispute.assigned_to is distinct from v_actor and not v_can_manage_all then
      raise exception 'dispute_must_be_claimed_before_decision';
    end if;

    if v_note is null or char_length(v_note) < 10 or char_length(v_note) > 1000 then
      raise exception 'resolution_note_required';
    end if;

    v_next_status := case p_action
      when 'buyer' then 'resolved_buyer'::public.dispute_status
      when 'seller' then 'resolved_seller'::public.dispute_status
      else 'rejected'::public.dispute_status
    end;

  elsif p_action = 'close' then
    if v_dispute.status = 'closed'::public.dispute_status then
      raise exception 'invalid_dispute_transition';
    end if;

    if v_dispute.assigned_to is distinct from v_actor and not v_can_manage_all then
      raise exception 'dispute_must_be_claimed_before_decision';
    end if;

    if v_note is null or char_length(v_note) < 10 or char_length(v_note) > 1000 then
      raise exception 'resolution_note_required';
    end if;

    v_next_status := 'closed'::public.dispute_status;

  else
    raise exception 'invalid_action';
  end if;

  update public.disputes
  set
    status = v_next_status,
    assigned_to = case
      when p_action = 'review' or v_can_manage_all then v_actor
      when assigned_to is null then v_actor
      else assigned_to
    end,
    resolution_note = case
      when p_action in ('buyer', 'seller', 'reject', 'close') then v_note
      else resolution_note
    end,
    resolved_at = case
      when p_action in ('buyer', 'seller', 'reject') then now()
      when p_action = 'close' then coalesce(resolved_at, now())
      else resolved_at
    end,
    updated_at = now()
  where id = p_dispute_id;

  insert into public.admin_actions(admin_id, action, target_type, target_id, reason, metadata)
  values (
    v_actor,
    p_action,
    'dispute',
    p_dispute_id,
    v_note,
    jsonb_build_object(
      'from_status', v_dispute.status::text,
      'to_status', v_next_status::text,
      'assigned_to', case
        when p_action = 'review' then v_actor::text
        when v_dispute.assigned_to is null then v_actor::text
        else v_dispute.assigned_to::text
      end
    )
  );

  insert into public.audit_logs(actor_id, action, entity_type, entity_id, description, metadata)
  values (
    v_actor,
    case
      when p_action in ('buyer', 'seller') then 'approve'::public.audit_action
      when p_action = 'reject' then 'reject'::public.audit_action
      else 'update'::public.audit_action
    end,
    'dispute',
    p_dispute_id,
    'Litige traité : ' || p_action,
    jsonb_build_object(
      'from_status', v_dispute.status::text,
      'to_status', v_next_status::text
    )
  );
end;
$function$;

revoke all on function private.admin_update_dispute(uuid, text, text) from public, anon;
grant execute on function private.admin_update_dispute(uuid, text, text) to authenticated, service_role;

create or replace function public.admin_update_dispute(
  p_dispute_id uuid,
  p_action text,
  p_note text default null
)
returns void
language plpgsql
security invoker
set search_path to ''
as $function$
begin
  if not public.current_user_has_permission('support.manage') then
    raise exception 'forbidden';
  end if;
  perform private.admin_update_dispute(p_dispute_id, p_action, p_note);
end;
$function$;

revoke all on function public.admin_update_dispute(uuid, text, text) from public, anon;
grant execute on function public.admin_update_dispute(uuid, text, text) to authenticated, service_role;


-- Both order participants can read the shared case and its final resolution.
drop policy if exists "users view disputes they opened" on public.disputes;
create policy "order participants can view disputes"
  on public.disputes
  for select
  to authenticated
  using (
    private.is_order_buyer(order_id)
    or private.is_order_seller(order_id)
  );


-- Notify the non-acting order participants when a dispute is opened or updated.
create or replace function private.notify_dispute_participants()
returns trigger
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_order public.orders%rowtype;
  v_actor uuid := auth.uid();
  v_recipient uuid;
  v_title text;
  v_body text;
begin
  select * into v_order
  from public.orders
  where id = new.order_id;

  if not found then
    return new;
  end if;

  if tg_op = 'INSERT' then
    v_title := 'Nouveau litige sur une commande';
    v_body := 'Un litige a été ouvert pour la commande ' ||
      left(new.order_id::text, 8) ||
      '. Consulte tes commandes pour suivre le dossier.';
  else
    v_title := 'Mise à jour de ton litige';
    v_body := 'Le dossier lié à la commande ' ||
      coalesce(v_order.order_number::text, left(new.order_id::text, 8)) ||
      ' a été mis à jour : ' || new.status::text || '.';
  end if;

  for v_recipient in
    select distinct participant_id
    from (
      select v_order.buyer_id as participant_id
      union
      select s.owner_id as participant_id
      from public.order_items oi
      join public.shops s on s.id = oi.shop_id
      where oi.order_id = new.order_id
    ) participants
    where participant_id is not null
      and (v_actor is null or participant_id <> v_actor)
  loop
    insert into public.notifications(user_id, type, title, body, data)
    values (
      v_recipient,
      'system'::public.notification_type,
      v_title,
      v_body,
      jsonb_build_object(
        'kind', 'dispute_case',
        'dispute_id', new.id,
        'order_id', new.order_id,
        'status', new.status::text
      )
    );
  end loop;

  return new;
end;
$function$;

revoke all on function private.notify_dispute_participants() from public, anon, authenticated;
grant execute on function private.notify_dispute_participants() to service_role;

drop trigger if exists disputes_notify_participants on public.disputes;
create trigger disputes_notify_participants
  after insert or update of status, assigned_to, resolution_note
  on public.disputes
  for each row
  execute function private.notify_dispute_participants();
