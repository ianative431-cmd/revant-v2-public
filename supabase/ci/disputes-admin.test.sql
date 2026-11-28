\set ON_ERROR_STOP on

insert into public.permissions(id,key) values
 ('30000000-0000-4000-8000-000000000001','support.manage'),
 ('30000000-0000-4000-8000-000000000002','users.manage');

insert into public.role_permissions(role,permission_id) values
 ('support_admin','30000000-0000-4000-8000-000000000001'),
 ('admin','30000000-0000-4000-8000-000000000001'),
 ('admin','30000000-0000-4000-8000-000000000002');

insert into public.profiles(id,display_name) values
 ('00000000-0000-4000-8000-000000000001','Acheteur'),
 ('00000000-0000-4000-8000-000000000002','Vendeur'),
 ('00000000-0000-4000-8000-000000000003','Agent support'),
 ('00000000-0000-4000-8000-000000000004','Administrateur'),
 ('00000000-0000-4000-8000-000000000005','Utilisateur tiers');

insert into public.user_roles(user_id,role) values
 ('00000000-0000-4000-8000-000000000003','support_admin'),
 ('00000000-0000-4000-8000-000000000004','admin');

insert into public.shops(id,owner_id) values
 ('10000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000002');

insert into public.orders(id,buyer_id,status) values
 ('20000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000001','pending'),
 ('20000000-0000-4000-8000-000000000002','00000000-0000-4000-8000-000000000001','confirmed'),
 ('20000000-0000-4000-8000-000000000003','00000000-0000-4000-8000-000000000001','delivered'),
 ('20000000-0000-4000-8000-000000000004','00000000-0000-4000-8000-000000000001','cancelled'),
 ('20000000-0000-4000-8000-000000000005','00000000-0000-4000-8000-000000000001','refunded'),
 ('20000000-0000-4000-8000-000000000006','00000000-0000-4000-8000-000000000001','processing');

insert into public.order_items(id,order_id,shop_id) values
 ('40000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000001'),
 ('40000000-0000-4000-8000-000000000002','20000000-0000-4000-8000-000000000003','10000000-0000-4000-8000-000000000001'),
 ('40000000-0000-4000-8000-000000000003','20000000-0000-4000-8000-000000000006','10000000-0000-4000-8000-000000000001');

do $block$
begin
  if (select prosecdef from pg_proc where oid='public.admin_update_dispute(uuid,text,text)'::regprocedure) then
    raise exception 'public dispute RPC must be SECURITY INVOKER';
  end if;
  if not (select prosecdef from pg_proc where oid='private.admin_update_dispute(uuid,text,text)'::regprocedure) then
    raise exception 'private dispute implementation must be SECURITY DEFINER';
  end if;
  if has_function_privilege('anon','public.admin_update_dispute(uuid,text,text)','EXECUTE') then
    raise exception 'anonymous role can execute dispute decisions';
  end if;
end;
$block$;

-- Pending, cancelled and refunded orders cannot enter the formal dispute workflow.
begin;
set local role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000001',true);
select set_config('request.jwt.claims','{"sub":"00000000-0000-4000-8000-000000000001","role":"authenticated"}',true);
do $block$
begin
  begin
    insert into public.disputes(order_id,opened_by,reason,description)
    values ('20000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000001','Commande en attente','Description de test suffisamment longue.');
    raise exception 'pending order dispute unexpectedly succeeded';
  exception when insufficient_privilege then null;
  end;

  begin
    insert into public.disputes(order_id,opened_by,reason,description)
    values ('20000000-0000-4000-8000-000000000004','00000000-0000-4000-8000-000000000001','Commande annulée','Description de test suffisamment longue.');
    raise exception 'cancelled order dispute unexpectedly succeeded';
  exception when insufficient_privilege then null;
  end;

  begin
    insert into public.disputes(order_id,opened_by,reason,description)
    values ('20000000-0000-4000-8000-000000000005','00000000-0000-4000-8000-000000000001','Commande remboursée','Description de test suffisamment longue.');
    raise exception 'refunded order dispute unexpectedly succeeded';
  exception when insufficient_privilege then null;
  end;
end;
$block$;
reset role;
commit;

-- A buyer can open one dispute for a confirmed order.
begin;
set local role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000001',true);
select set_config('request.jwt.claims','{"sub":"00000000-0000-4000-8000-000000000001","role":"authenticated"}',true);
insert into public.disputes(id,order_id,opened_by,reason,description)
values (
 '50000000-0000-4000-8000-000000000001',
 '20000000-0000-4000-8000-000000000002',
 '00000000-0000-4000-8000-000000000001',
 'Article non conforme',
 'Le produit reçu ne correspond pas à la description publiée.'
);
reset role;
commit;

-- A seller can open a dispute for a delivered order they own.
begin;
set local role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000002',true);
select set_config('request.jwt.claims','{"sub":"00000000-0000-4000-8000-000000000002","role":"authenticated"}',true);
insert into public.disputes(id,order_id,opened_by,reason,description)
values (
 '50000000-0000-4000-8000-000000000002',
 '20000000-0000-4000-8000-000000000003',
 '00000000-0000-4000-8000-000000000002',
 'Client absent',
 'Le client ne répond pas malgré plusieurs tentatives de livraison.'
);
reset role;
commit;

-- A non-participant cannot open a dispute, and one dispute per order is enforced.
begin;
set local role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000005',true);
select set_config('request.jwt.claims','{"sub":"00000000-0000-4000-8000-000000000005","role":"authenticated"}',true);
do $block$
begin
  begin
    insert into public.disputes(order_id,opened_by,reason,description)
    values ('20000000-0000-4000-8000-000000000006','00000000-0000-4000-8000-000000000005','Litige tiers','Description de test suffisamment longue.');
    raise exception 'non-participant dispute unexpectedly succeeded';
  exception when insufficient_privilege then null;
  end;
end;
$block$;
reset role;
commit;

begin;
set local role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000002',true);
select set_config('request.jwt.claims','{"sub":"00000000-0000-4000-8000-000000000002","role":"authenticated"}',true);
do $block$
begin
  begin
    insert into public.disputes(order_id,opened_by,reason,description)
    values ('20000000-0000-4000-8000-000000000002','00000000-0000-4000-8000-000000000002','Deuxième litige','Description de test suffisamment longue.');
    raise exception 'duplicate order dispute unexpectedly succeeded';
  exception when unique_violation then null;
  end;
end;
$block$;
reset role;
commit;

-- Support agent claims the case. An admin can reassign; another agent cannot decide it.
begin;
set local role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000003',true);
select set_config('request.jwt.claims','{"sub":"00000000-0000-4000-8000-000000000003","role":"authenticated"}',true);
select public.admin_update_dispute('50000000-0000-4000-8000-000000000001','review',null);
reset role;
do $block$
begin
  if not exists (
    select 1 from public.disputes
    where id='50000000-0000-4000-8000-000000000001'
      and status='under_review' and assigned_to='00000000-0000-4000-8000-000000000003'
  ) then raise exception 'support agent claim failed'; end if;
end;
$block$;
reset role;
commit;

begin;
set local role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000004',true);
select set_config('request.jwt.claims','{"sub":"00000000-0000-4000-8000-000000000004","role":"authenticated"}',true);
select public.admin_update_dispute('50000000-0000-4000-8000-000000000001','review','Reprise du dossier par un administrateur.');
reset role;
commit;

begin;
set local role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000003',true);
select set_config('request.jwt.claims','{"sub":"00000000-0000-4000-8000-000000000003","role":"authenticated"}',true);
do $block$
begin
  begin
    perform public.admin_update_dispute('50000000-0000-4000-8000-000000000001','buyer','Décision en faveur de l’acheteur.');
    raise exception 'unassigned support agent unexpectedly decided another agent case';
  exception when others then
    if sqlerrm='unassigned support agent unexpectedly decided another agent case' then raise; end if;
    if sqlerrm <> 'dispute_assigned_to_another_agent' and sqlerrm <> 'dispute_must_be_claimed_before_decision' then raise; end if;
  end;
end;
$block$;
reset role;
commit;

-- Resolution requires a meaningful note and creates both admin and audit records.
begin;
set local role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000004',true);
select set_config('request.jwt.claims','{"sub":"00000000-0000-4000-8000-000000000004","role":"authenticated"}',true);
do $block$
begin
  begin
    perform public.admin_update_dispute('50000000-0000-4000-8000-000000000001','buyer',null);
    raise exception 'resolution without note unexpectedly succeeded';
  exception when others then
    if sqlerrm='resolution without note unexpectedly succeeded' then raise; end if;
    if sqlerrm <> 'resolution_note_required' then raise; end if;
  end;
end;
$block$;
select public.admin_update_dispute(
 '50000000-0000-4000-8000-000000000001',
 'buyer',
 'Décision favorable à l’acheteur après vérification du dossier.'
);
reset role;
do $block$
begin
  if not exists (
    select 1 from public.disputes
    where id='50000000-0000-4000-8000-000000000001'
      and status='resolved_buyer'
      and resolved_at is not null
      and char_length(resolution_note) >= 10
  ) then raise exception 'dispute resolution not persisted'; end if;
  if (select count(*) from public.admin_actions where target_type='dispute' and target_id='50000000-0000-4000-8000-000000000001') <> 3 then
    raise exception 'dispute admin action history incomplete';
  end if;
  if (select count(*) from public.audit_logs where entity_type='dispute' and entity_id='50000000-0000-4000-8000-000000000001') <> 3 then
    raise exception 'dispute audit history incomplete';
  end if;
end;
$block$;
set local role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000004',true);
select set_config('request.jwt.claims','{"sub":"00000000-0000-4000-8000-000000000004","role":"authenticated"}',true);
select public.admin_update_dispute(
 '50000000-0000-4000-8000-000000000001',
 'close',
 'Dossier clôturé après notification de la décision.'
);
reset role;
commit;

-- A support agent can resolve a case they personally claimed.
begin;
set local role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000003',true);
select set_config('request.jwt.claims','{"sub":"00000000-0000-4000-8000-000000000003","role":"authenticated"}',true);
select public.admin_update_dispute('50000000-0000-4000-8000-000000000002','review',null);
select public.admin_update_dispute(
 '50000000-0000-4000-8000-000000000002',
 'seller',
 'Décision favorable au vendeur après examen du dossier.'
);
reset role;
commit;

do $block$
begin
  if not exists (
    select 1 from public.disputes
    where id='50000000-0000-4000-8000-000000000002'
      and status='resolved_seller'
      and assigned_to='00000000-0000-4000-8000-000000000003'
  ) then raise exception 'support agent resolution failed'; end if;
end;
$block$;

select 'dispute eligibility, assignment, decisions and audit tests passed' as result;
