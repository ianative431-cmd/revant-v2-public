\set ON_ERROR_STOP on

insert into public.profiles(id) values
 ('00000000-0000-4000-8000-000000000001'),
 ('00000000-0000-4000-8000-000000000002');

-- A valid report is stored and its creation is recorded in the audit log.
insert into public.reports(reporter_id,target_type,target_id,reason,description)
values (
 '00000000-0000-4000-8000-000000000001',
 'product',
 '10000000-0000-4000-8000-000000000001',
 'fraud',
 'Annonce suspecte'
);

do $$
begin
  if (select count(*) from public.audit_logs where entity_type='report' and action='create') <> 1 then
    raise exception 'report creation was not audited';
  end if;
  if not exists (
    select 1 from public.audit_logs
    where actor_id='00000000-0000-4000-8000-000000000001'
      and entity_type='report'
      and metadata->>'target_type'='product'
      and metadata->>'reason'='fraud'
  ) then
    raise exception 'report audit metadata is incomplete';
  end if;
end;
$$;

-- Active duplicate reports are rejected, including while a report is being reviewed.
do $$
begin
  begin
    insert into public.reports(reporter_id,target_type,target_id,reason)
    values ('00000000-0000-4000-8000-000000000001','product','10000000-0000-4000-8000-000000000001','fraud');
    raise exception 'duplicate open report unexpectedly succeeded';
  exception when unique_violation then
    null;
  end;
end;
$$;

update public.reports set status='reviewing'
where reporter_id='00000000-0000-4000-8000-000000000001';

do $$
begin
  begin
    insert into public.reports(reporter_id,target_type,target_id,reason)
    values ('00000000-0000-4000-8000-000000000001','product','10000000-0000-4000-8000-000000000001','fraud');
    raise exception 'duplicate reviewing report unexpectedly succeeded';
  exception when unique_violation then
    null;
  end;
end;
$$;

-- Resolved reports no longer occupy the active-report uniqueness slot.
update public.reports set status='resolved'
where reporter_id='00000000-0000-4000-8000-000000000001';

insert into public.reports(reporter_id,target_type,target_id,reason)
values ('00000000-0000-4000-8000-000000000001','product','10000000-0000-4000-8000-000000000001','fraud');

-- Target types, reasons and description lengths are constrained at the database boundary.
do $$
begin
  begin
    insert into public.reports(reporter_id,target_type,target_id,reason)
    values ('00000000-0000-4000-8000-000000000002','unknown','10000000-0000-4000-8000-000000000002','fraud');
    raise exception 'invalid report target type unexpectedly succeeded';
  exception when check_violation then
    null;
  end;

  begin
    insert into public.reports(reporter_id,target_type,target_id,reason)
    values ('00000000-0000-4000-8000-000000000002','shop','10000000-0000-4000-8000-000000000003','unknown');
    raise exception 'invalid report reason unexpectedly succeeded';
  exception when check_violation then
    null;
  end;

  begin
    insert into public.reports(reporter_id,target_type,target_id,reason,description)
    values ('00000000-0000-4000-8000-000000000002','shop','10000000-0000-4000-8000-000000000004','spam',repeat('x',1001));
    raise exception 'oversized report description unexpectedly succeeded';
  exception when check_violation then
    null;
  end;
end;
$$;

do $$
begin
  if has_function_privilege('anon','private.audit_report_created()','EXECUTE')
     or has_function_privilege('authenticated','private.audit_report_created()','EXECUTE') then
    raise exception 'report audit trigger function is directly executable by API roles';
  end if;
end;
$$;

select 'report constraints, uniqueness and audit tests passed' as result;
