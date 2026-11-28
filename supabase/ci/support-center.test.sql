\set ON_ERROR_STOP on

insert into public.profiles(id) values
 ('00000000-0000-4000-8000-000000000001'),
 ('00000000-0000-4000-8000-000000000002'),
 ('00000000-0000-4000-8000-000000000003'),
 ('00000000-0000-4000-8000-000000000004'),
 ('00000000-0000-4000-8000-000000000005');

insert into public.permissions(id,key)
values
 ('30000000-0000-4000-8000-000000000001','support.manage'),
 ('30000000-0000-4000-8000-000000000002','users.manage');
insert into public.user_roles(user_id,role)
values
 ('00000000-0000-4000-8000-000000000002','support_admin'),
 ('00000000-0000-4000-8000-000000000004','support_admin'),
 ('00000000-0000-4000-8000-000000000005','admin');
insert into public.role_permissions(role,permission_id)
values
 ('support_admin','30000000-0000-4000-8000-000000000001'),
 ('admin','30000000-0000-4000-8000-000000000001'),
 ('admin','30000000-0000-4000-8000-000000000002');

-- A buyer can create their own ticket; the trigger records the creator.
begin;
set local role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000001',true);
select set_config('request.jwt.claims','{"sub":"00000000-0000-4000-8000-000000000001","role":"authenticated"}',true);
insert into public.support_tickets(id,user_id,subject,description)
values (
 '10000000-0000-4000-8000-000000000001',
 '00000000-0000-4000-8000-000000000001',
 'Commande non reçue',
 'Le livreur n’est pas arrivé et je souhaite obtenir une aide.'
);
reset role;
commit;

do $$
begin
  if not exists (
    select 1 from public.support_ticket_events
    where ticket_id='10000000-0000-4000-8000-000000000001'
      and actor_id='00000000-0000-4000-8000-000000000001'
      and event_type='created'
  ) then raise exception 'ticket creation event missing'; end if;
end;
$$;

-- A support agent can see and claim an unassigned ticket.
begin;
set local role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000002',true);
select set_config('request.jwt.claims','{"sub":"00000000-0000-4000-8000-000000000002","role":"authenticated"}',true);
do $$
begin
  if (select count(*) from public.support_tickets where id='10000000-0000-4000-8000-000000000001') <> 1 then
    raise exception 'support staff cannot view tickets';
  end if;
end;
$$;
select public.claim_support_ticket('10000000-0000-4000-8000-000000000001');
do $$
begin
  begin
    insert into public.support_messages(ticket_id,sender_id,body)
    values ('10000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000002','Insertion directe interdite');
    raise exception 'support agent bypassed the controlled staff reply RPC';
  exception when insufficient_privilege then
    null;
  end;
end;
$$;
select public.staff_reply_to_support_ticket('10000000-0000-4000-8000-000000000001','Nous vérifions votre livraison et revenons vers vous.');
select public.update_support_ticket('10000000-0000-4000-8000-000000000001','resolved','high');
reset role;
commit;

do $$
begin
  if not exists (
    select 1 from public.support_tickets
    where id='10000000-0000-4000-8000-000000000001'
      and assigned_to='00000000-0000-4000-8000-000000000002'
      and status='resolved' and priority='high' and resolved_at is not null
  ) then raise exception 'support ticket status/assignment update failed'; end if;
  if (select count(*) from public.support_messages where ticket_id='10000000-0000-4000-8000-000000000001') <> 1 then
    raise exception 'staff reply was not stored';
  end if;
  if not exists (
    select 1 from public.notifications
    where user_id='00000000-0000-4000-8000-000000000001'
      and type='message'
      and data->>'support_ticket_id'='10000000-0000-4000-8000-000000000001'
  ) then raise exception 'customer notification for staff reply missing'; end if;
  if not exists (
    select 1 from public.support_ticket_events
    where ticket_id='10000000-0000-4000-8000-000000000001'
      and actor_id='00000000-0000-4000-8000-000000000002'
      and event_type='message_sent'
  ) then raise exception 'staff message event missing'; end if;
end;
$$;

-- The buyer can reply to a resolved ticket and reopen it; the event actor is the buyer.
begin;
set local role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000001',true);
select set_config('request.jwt.claims','{"sub":"00000000-0000-4000-8000-000000000001","role":"authenticated"}',true);
do $$
begin
  begin
    insert into public.support_messages(ticket_id,sender_id,body)
    values ('10000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000001','Insertion directe interdite');
    raise exception 'buyer bypassed the controlled reply RPC';
  exception when insufficient_privilege then
    null;
  end;
end;
$$;
select public.reply_to_support_ticket('10000000-0000-4000-8000-000000000001','Merci, voici une précision sur mon adresse.');
reset role;
commit;

do $$
begin
  if not exists (
    select 1 from public.support_tickets
    where id='10000000-0000-4000-8000-000000000001'
      and status='open' and resolved_at is null
  ) then raise exception 'buyer reply did not reopen ticket'; end if;
  if not exists (
    select 1 from public.support_ticket_events
    where ticket_id='10000000-0000-4000-8000-000000000001'
      and actor_id='00000000-0000-4000-8000-000000000001'
      and event_type='status_changed'
      and metadata->>'to'='open'
  ) then raise exception 'buyer reopen event missing'; end if;
  if not exists (
    select 1 from public.notifications
    where user_id='00000000-0000-4000-8000-000000000002'
      and type='message'
      and data->>'support_ticket_id'='10000000-0000-4000-8000-000000000001'
  ) then raise exception 'agent notification for customer reply missing'; end if;
end;
$$;

-- Notifications are readable only by their intended recipients.
begin;
set local role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000001',true);
select set_config('request.jwt.claims','{"sub":"00000000-0000-4000-8000-000000000001","role":"authenticated"}',true);
do $$
begin
  if (select count(*) from public.notifications where data->>'support_ticket_id'='10000000-0000-4000-8000-000000000001') <> 1 then
    raise exception 'customer cannot read only their support notification';
  end if;
end;
$$;
reset role;
commit;

begin;
set local role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000002',true);
select set_config('request.jwt.claims','{"sub":"00000000-0000-4000-8000-000000000002","role":"authenticated"}',true);
do $$
begin
  if (select count(*) from public.notifications where data->>'support_ticket_id'='10000000-0000-4000-8000-000000000001') <> 1 then
    raise exception 'assigned agent cannot read their support notification';
  end if;
end;
$$;
reset role;
commit;

-- A second support agent cannot take a ticket already assigned to another agent.
begin;
set local role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000004',true);
select set_config('request.jwt.claims','{"sub":"00000000-0000-4000-8000-000000000004","role":"authenticated"}',true);
do $$
begin
  if (select count(*) from public.support_tickets where id='10000000-0000-4000-8000-000000000001') <> 0 then
    raise exception 'second support agent can view another agent ticket';
  end if;
  if (select count(*) from public.support_messages where ticket_id='10000000-0000-4000-8000-000000000001') <> 0 then
    raise exception 'second support agent can read another agent messages';
  end if;
  if (select count(*) from public.support_ticket_events where ticket_id='10000000-0000-4000-8000-000000000001') <> 0 then
    raise exception 'second support agent can read another agent events';
  end if;
  begin
    perform public.claim_support_ticket('10000000-0000-4000-8000-000000000001');
    raise exception 'second agent claimed another agent ticket';
  exception when others then
    if sqlerrm = 'second agent claimed another agent ticket' then raise; end if;
    if sqlerrm <> 'ticket_assigned_to_other' then raise; end if;
  end;
end;
$$;
reset role;
commit;

-- Elevated administrators can review all support cases and their history.
begin;
set local role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000005',true);
select set_config('request.jwt.claims','{"sub":"00000000-0000-4000-8000-000000000005","role":"authenticated"}',true);
do $$
begin
  if (select count(*) from public.support_tickets where id='10000000-0000-4000-8000-000000000001') <> 1 then
    raise exception 'elevated admin cannot view all support tickets';
  end if;
  if (select count(*) from public.support_ticket_events where ticket_id='10000000-0000-4000-8000-000000000001') = 0 then
    raise exception 'elevated admin cannot view support event history';
  end if;
end;
$$;
reset role;
commit;

-- A regular buyer cannot use staff actions or read another customer's ticket.
begin;
set local role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000003',true);
select set_config('request.jwt.claims','{"sub":"00000000-0000-4000-8000-000000000003","role":"authenticated"}',true);
do $$
begin
  if (select count(*) from public.support_tickets where id='10000000-0000-4000-8000-000000000001') <> 0 then
    raise exception 'non-participant can read another ticket';
  end if;
  begin
    perform public.claim_support_ticket('10000000-0000-4000-8000-000000000001');
    raise exception 'buyer used staff claim function';
  exception when others then
    if sqlerrm = 'buyer used staff claim function' then raise; end if;
    if sqlerrm <> 'forbidden' then raise; end if;
  end;
end;
$$;
reset role;
commit;

-- Database constraints reject unsupported states, invalid priorities and oversized text.
do $$
begin
  begin
    insert into public.support_tickets(user_id,subject,description,status)
    values ('00000000-0000-4000-8000-000000000003','Commande invalide','Description suffisamment longue pour ce test.','pending');
    raise exception 'invalid support status unexpectedly succeeded';
  exception when check_violation then null;
  end;

  begin
    insert into public.support_tickets(user_id,subject,description,priority)
    values ('00000000-0000-4000-8000-000000000003','Commande invalide','Description suffisamment longue pour ce test.','critical');
    raise exception 'invalid support priority unexpectedly succeeded';
  exception when check_violation then null;
  end;

  begin
    insert into public.support_tickets(user_id,subject,description)
    values ('00000000-0000-4000-8000-000000000003','Bad','Description suffisamment longue pour ce test.');
    raise exception 'short support subject unexpectedly succeeded';
  exception when check_violation then null;
  end;

  begin
    insert into public.support_tickets(user_id,subject,description)
    values ('00000000-0000-4000-8000-000000000003','Sujet valide',repeat('x',3001));
    raise exception 'oversized support description unexpectedly succeeded';
  exception when check_violation then null;
  end;

  begin
    insert into public.support_messages(ticket_id,sender_id,body)
    values ('10000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000003',repeat('x',5001));
    raise exception 'oversized support message unexpectedly succeeded';
  exception when check_violation then null;
  end;
end;
$$;

-- Removing support.manage revokes staff visibility even while the ticket remains assigned.
delete from public.user_roles
where user_id='00000000-0000-4000-8000-000000000002' and role='support_admin';
begin;
set local role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000002',true);
select set_config('request.jwt.claims','{"sub":"00000000-0000-4000-8000-000000000002","role":"authenticated"}',true);
do $$
begin
  if (select count(*) from public.support_tickets where id='10000000-0000-4000-8000-000000000001') <> 0 then
    raise exception 'revoked support agent can still view assigned ticket';
  end if;
  if (select count(*) from public.support_messages where ticket_id='10000000-0000-4000-8000-000000000001') <> 0 then
    raise exception 'revoked support agent can still view assigned messages';
  end if;
  if (select count(*) from public.support_ticket_events where ticket_id='10000000-0000-4000-8000-000000000001') <> 0 then
    raise exception 'revoked support agent can still view assigned events';
  end if;
end;
$$;
reset role;
commit;

-- Ticket events are staff-readable only and immutable.
do $$
begin
  if has_table_privilege('anon','public.support_ticket_events','SELECT') then
    raise exception 'anonymous role can read support events';
  end if;
  begin
    update public.support_ticket_events set metadata='{}'::jsonb
    where ticket_id='10000000-0000-4000-8000-000000000001';
    raise exception 'support event update unexpectedly succeeded';
  exception when others then
    if sqlerrm = 'support event update unexpectedly succeeded' then raise; end if;
    if sqlerrm <> 'support_ticket_events_immutable' then raise; end if;
  end;
end;
$$;

do $
begin
  if not exists (
    select 1 from pg_policies
    where schemaname='public' and tablename='support_tickets'
      and policyname='owners and support staff view tickets' and cmd='SELECT'
  ) then raise exception 'consolidated support ticket SELECT policy missing'; end if;

  if exists (
    select 1 from pg_policies
    where schemaname='public' and tablename='support_tickets'
      and policyname in ('support staff view tickets','users view own tickets')
  ) then raise exception 'duplicate support ticket SELECT policies remain'; end if;

  if not exists (
    select 1 from pg_policies
    where schemaname='public' and tablename='support_messages'
      and policyname='owners and support staff view messages' and cmd='SELECT'
  ) then raise exception 'consolidated support message SELECT policy missing'; end if;

  if exists (
    select 1 from pg_policies
    where schemaname='public' and tablename='support_messages'
      and policyname in ('support staff view messages','ticket users view messages')
  ) then raise exception 'duplicate support message SELECT policies remain'; end if;

  if to_regclass('public.support_ticket_events_actor_id_idx') is null then
    raise exception 'support ticket event actor index missing';
  end if;
  if to_regclass('public.super_admin_bootstrap_claims_user_id_idx') is null then
    raise exception 'Super Admin bootstrap claim user index missing';
  end if;
end;
$;

select 'support ticket workflow and permission tests passed' as result;
do $$
begin
  if (select prosecdef from pg_proc where oid='public.reply_to_support_ticket(uuid,text)'::regprocedure)
     or (select prosecdef from pg_proc where oid='public.claim_support_ticket(uuid)'::regprocedure)
     or (select prosecdef from pg_proc where oid='public.staff_reply_to_support_ticket(uuid,text)'::regprocedure)
     or (select prosecdef from pg_proc where oid='public.update_support_ticket(uuid,text,text)'::regprocedure) then
    raise exception 'public support RPC wrappers must be SECURITY INVOKER';
  end if;
  if not (select prosecdef from pg_proc where oid='private.support_reply_to_ticket_impl(uuid,text)'::regprocedure)
     or not (select prosecdef from pg_proc where oid='private.support_claim_ticket_impl(uuid)'::regprocedure)
     or not (select prosecdef from pg_proc where oid='private.support_staff_reply_to_ticket_impl(uuid,text)'::regprocedure)
     or not (select prosecdef from pg_proc where oid='private.support_update_ticket_impl(uuid,text,text)'::regprocedure) then
    raise exception 'private support implementations must be SECURITY DEFINER';
  end if;
  if has_function_privilege('anon','public.claim_support_ticket(uuid)','EXECUTE')
     or has_function_privilege('anon','private.support_claim_ticket_impl(uuid)','EXECUTE') then
    raise exception 'anonymous role can execute support mutations';
  end if;
  if not has_function_privilege('authenticated','public.claim_support_ticket(uuid)','EXECUTE')
     or not has_function_privilege('authenticated','private.support_claim_ticket_impl(uuid)','EXECUTE') then
    raise exception 'authenticated role is missing support RPC execution';
  end if;
end;
$$;

