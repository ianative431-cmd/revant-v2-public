-- Prevent concurrent duplicate reports for the same target and record report creation.
alter table public.reports
  add constraint reports_target_type_check
    check (target_type in ('user','shop','product','review','message','order')),
  add constraint reports_reason_check
    check (reason in ('spam','fraud','counterfeit','inappropriate','harassment','misleading','other')),
  add constraint reports_description_length_check
    check (description is null or char_length(description) <= 1000);

create unique index if not exists reports_one_active_reporter_target_uidx
  on public.reports(reporter_id, target_type, target_id)
  where status in ('open','reviewing');

create index if not exists reports_status_created_idx
  on public.reports(status, created_at desc);

create index if not exists reports_assigned_status_created_idx
  on public.reports(assigned_to, status, created_at desc);

create or replace function private.audit_report_created()
returns trigger
language plpgsql
security definer
set search_path to ''
as $function$
begin
  insert into public.audit_logs(
    actor_id, action, entity_type, entity_id, description, metadata
  )
  values (
    new.reporter_id,
    'create'::public.audit_action,
    'report',
    new.id,
    'Report created',
    jsonb_build_object(
      'target_type', new.target_type,
      'reason', new.reason
    )
  );
  return new;
end;
$function$;

revoke all on function private.audit_report_created() from public, anon, authenticated;
create trigger reports_audit_after_insert
  after insert on public.reports
  for each row execute function private.audit_report_created();
