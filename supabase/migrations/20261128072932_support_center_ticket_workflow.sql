-- Turn the existing dormant support tables into a controlled support-ticket workflow.
alter table public.support_tickets
  add column if not exists resolved_at timestamptz,
  add constraint support_tickets_status_check
    check (status in ('open','in_progress','waiting_user','resolved','closed')),
  add constraint support_tickets_priority_check
    check (priority in ('low','normal','high','urgent')),
  add constraint support_tickets_subject_length_check
    check (char_length(trim(subject)) between 5 and 160),
  add constraint support_tickets_description_length_check
    check (char_length(trim(description)) between 10 and 3000);

alter table public.support_messages
  add constraint support_messages_body_length_check
    check (char_length(trim(body)) between 1 and 5000);

create index if not exists support_tickets_status_created_idx
  on public.support_tickets(status, created_at desc);

create index if not exists support_tickets_assigned_status_created_idx
  on public.support_tickets(assigned_to, status, updated_at desc);

create index if not exists support_messages_ticket_created_idx
  on public.support_messages(ticket_id, created_at asc);

create table public.support_ticket_events (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.support_tickets(id) on delete restrict,
  actor_id uuid references public.profiles(id) on delete set null,
  event_type text not null check (event_type in (
    'created','status_changed','priority_changed','assigned','unassigned','message_sent'
  )),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index support_ticket_events_ticket_created_idx
  on public.support_ticket_events(ticket_id, created_at asc);

alter table public.support_ticket_events enable row level security;
revoke all on table public.support_ticket_events from public, anon, authenticated;
grant select on table public.support_ticket_events to authenticated, service_role;

drop policy if exists "support staff view tickets" on public.support_tickets;
create policy "support staff view tickets"
  on public.support_tickets for select to authenticated
  using (
    public.current_user_has_permission('support.manage')
    and (
      public.current_user_has_permission('users.manage')
      or assigned_to is null
      or assigned_to = (select auth.uid())
    )
  );

drop policy if exists "support staff view messages" on public.support_messages;
create policy "support staff view messages"
  on public.support_messages for select to authenticated
  using (
    public.current_user_has_permission('support.manage')
    and exists (
      select 1
      from public.support_tickets t
      where t.id = support_messages.ticket_id
        and (
          public.current_user_has_permission('users.manage')
          or t.assigned_to is null
          or t.assigned_to = (select auth.uid())
        )
    )
  );

drop policy if exists "support staff view ticket events" on public.support_ticket_events;
create policy "support staff view ticket events"
  on public.support_ticket_events for select to authenticated
  using (
    public.current_user_has_permission('support.manage')
    and exists (
      select 1
      from public.support_tickets t
      where t.id = support_ticket_events.ticket_id
        and (
          public.current_user_has_permission('users.manage')
          or t.assigned_to is null
          or t.assigned_to = (select auth.uid())
        )
    )
  );

create or replace function private.log_support_ticket_event()
returns trigger
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_actor uuid := coalesce(auth.uid(), new.assigned_to, new.user_id);
begin
  if tg_op = 'INSERT' then
    insert into public.support_ticket_events(ticket_id, actor_id, event_type, metadata)
    values (
      new.id, coalesce(auth.uid(), new.user_id), 'created',
      jsonb_build_object('status', new.status, 'priority', new.priority)
    );
    return new;
  end if;

  if new.status is distinct from old.status then
    insert into public.support_ticket_events(ticket_id, actor_id, event_type, metadata)
    values (
      new.id, v_actor, 'status_changed',
      jsonb_build_object('from', old.status, 'to', new.status)
    );
  end if;

  if new.priority is distinct from old.priority then
    insert into public.support_ticket_events(ticket_id, actor_id, event_type, metadata)
    values (
      new.id, v_actor, 'priority_changed',
      jsonb_build_object('from', old.priority, 'to', new.priority)
    );
  end if;

  if new.assigned_to is distinct from old.assigned_to then
    insert into public.support_ticket_events(ticket_id, actor_id, event_type, metadata)
    values (
      new.id,
      coalesce(auth.uid(), new.assigned_to, new.user_id),
      case when new.assigned_to is null then 'unassigned' else 'assigned' end,
      jsonb_build_object('from', old.assigned_to, 'to', new.assigned_to)
    );
  end if;

  return new;
end;
$function$;

create or replace function private.log_support_message_event()
returns trigger
language plpgsql
security definer
set search_path to ''
as $function$
begin
  insert into public.support_ticket_events(ticket_id, actor_id, event_type, metadata)
  values (
    new.ticket_id, new.sender_id, 'message_sent',
    jsonb_build_object('message_id', new.id)
  );
  return new;
end;
$function$;

create or replace function private.prevent_support_ticket_event_mutation()
returns trigger
language plpgsql
security definer
set search_path to ''
as $function$
begin
  raise exception 'support_ticket_events_immutable';
end;
$function$;

revoke all on function private.log_support_ticket_event() from public, anon, authenticated;
revoke all on function private.log_support_message_event() from public, anon, authenticated;
revoke all on function private.prevent_support_ticket_event_mutation() from public, anon, authenticated;

create trigger support_tickets_log_events
  after insert or update on public.support_tickets
  for each row execute function private.log_support_ticket_event();

create trigger support_messages_log_events
  after insert on public.support_messages
  for each row execute function private.log_support_message_event();

create trigger support_ticket_events_immutable
  before update or delete on public.support_ticket_events
  for each row execute function private.prevent_support_ticket_event_mutation();

create or replace function public.reply_to_support_ticket(
  p_ticket_id uuid, p_body text
)
returns void
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_user uuid := auth.uid();
  v_ticket public.support_tickets%rowtype;
begin
  if v_user is null then raise exception 'not_authenticated'; end if;
  if p_body is null or char_length(trim(p_body)) not between 1 and 5000 then
    raise exception 'invalid_message';
  end if;

  select * into v_ticket
  from public.support_tickets
  where id = p_ticket_id and user_id = v_user
  for update;

  if not found then raise exception 'ticket_not_found'; end if;
  if v_ticket.status = 'closed' then raise exception 'ticket_closed'; end if;

  insert into public.support_messages(ticket_id, sender_id, body)
  values (p_ticket_id, v_user, trim(p_body));

  update public.support_tickets
  set status = 'open', resolved_at = null, updated_at = now()
  where id = p_ticket_id;
end;
$function$;

create or replace function public.claim_support_ticket(p_ticket_id uuid)
returns void
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_user uuid := auth.uid();
  v_ticket public.support_tickets%rowtype;
begin
  if v_user is null or not public.current_user_has_permission('support.manage') then
    raise exception 'forbidden';
  end if;

  select * into v_ticket
  from public.support_tickets
  where id = p_ticket_id
  for update;

  if not found then raise exception 'ticket_not_found'; end if;
  if v_ticket.status in ('resolved','closed') then raise exception 'ticket_not_claimable'; end if;
  if v_ticket.assigned_to is not null
     and v_ticket.assigned_to <> v_user
     and not public.current_user_has_permission('users.manage') then
    raise exception 'ticket_assigned_to_other';
  end if;

  update public.support_tickets
  set assigned_to = v_user, status = 'in_progress', resolved_at = null, updated_at = now()
  where id = p_ticket_id;
end;
$function$;

create or replace function public.staff_reply_to_support_ticket(
  p_ticket_id uuid, p_body text
)
returns void
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_user uuid := auth.uid();
  v_ticket public.support_tickets%rowtype;
begin
  if v_user is null or not public.current_user_has_permission('support.manage') then
    raise exception 'forbidden';
  end if;
  if p_body is null or char_length(trim(p_body)) not between 1 and 5000 then
    raise exception 'invalid_message';
  end if;

  select * into v_ticket
  from public.support_tickets
  where id = p_ticket_id
  for update;

  if not found then raise exception 'ticket_not_found'; end if;
  if v_ticket.status = 'closed' then raise exception 'ticket_closed'; end if;
  if v_ticket.assigned_to is not null
     and v_ticket.assigned_to <> v_user
     and not public.current_user_has_permission('users.manage') then
    raise exception 'ticket_assigned_to_other';
  end if;

  update public.support_tickets
  set assigned_to = v_user, status = 'waiting_user', resolved_at = null, updated_at = now()
  where id = p_ticket_id;

  insert into public.support_messages(ticket_id, sender_id, body)
  values (p_ticket_id, v_user, trim(p_body));
end;
$function$;

create or replace function public.update_support_ticket(
  p_ticket_id uuid, p_status text, p_priority text
)
returns void
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_user uuid := auth.uid();
  v_ticket public.support_tickets%rowtype;
begin
  if v_user is null or not public.current_user_has_permission('support.manage') then
    raise exception 'forbidden';
  end if;
  if p_status not in ('open','in_progress','waiting_user','resolved','closed') then
    raise exception 'invalid_status';
  end if;
  if p_priority not in ('low','normal','high','urgent') then
    raise exception 'invalid_priority';
  end if;

  select * into v_ticket
  from public.support_tickets
  where id = p_ticket_id
  for update;

  if not found then raise exception 'ticket_not_found'; end if;
  if v_ticket.assigned_to is not null
     and v_ticket.assigned_to <> v_user
     and not public.current_user_has_permission('users.manage') then
    raise exception 'ticket_assigned_to_other';
  end if;

  update public.support_tickets
  set assigned_to = coalesce(assigned_to, v_user),
      status = p_status,
      priority = p_priority,
      resolved_at = case when p_status in ('resolved','closed') then coalesce(resolved_at, now()) else null end,
      updated_at = now()
  where id = p_ticket_id;
end;
$function$;

revoke all on function public.reply_to_support_ticket(uuid, text) from public, anon;
revoke all on function public.claim_support_ticket(uuid) from public, anon;
revoke all on function public.staff_reply_to_support_ticket(uuid, text) from public, anon;
revoke all on function public.update_support_ticket(uuid, text, text) from public, anon;
grant execute on function public.reply_to_support_ticket(uuid, text) to authenticated, service_role;
grant execute on function public.claim_support_ticket(uuid) to authenticated, service_role;
grant execute on function public.staff_reply_to_support_ticket(uuid, text) to authenticated, service_role;
grant execute on function public.update_support_ticket(uuid, text, text) to authenticated, service_role;
