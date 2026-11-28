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
end;
$$;

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

select 'support ticket workflow and permission tests passed' as result;
