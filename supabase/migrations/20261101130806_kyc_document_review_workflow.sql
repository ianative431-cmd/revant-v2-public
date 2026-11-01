-- KYC review: associate a private Storage object with its owner record.
-- Existing bucket is private. The path is constrained to the submitting user's folder.
alter table public.kyc_profiles
  add column if not exists document_path text;

alter table public.kyc_profiles
  drop constraint if exists kyc_profiles_document_path_owner_check;

alter table public.kyc_profiles
  add constraint kyc_profiles_document_path_owner_check
  check (
    document_path is null
    or (
      length(document_path) <= 512
      and document_path not like '/%'
      and position('..' in document_path) = 0
      and position(E'\\' in document_path) = 0
      and split_part(document_path, '/', 1) = user_id::text
    )
  );

-- Future uploads must be placed in the authenticated user's own folder.
drop policy if exists "revant kyc insert" on storage.objects;
create policy "revant kyc insert"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'kyc-documents'
  and owner_id = (select auth.uid())::text
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

-- The database, not only the interface, enforces the review workflow.
create or replace function private.admin_update_kyc(
  p_kyc_id uuid,
  p_action text,
  p_reason text default null
)
returns void
language plpgsql
security definer
set search_path to 'public', 'private'
as $function$
declare
  k record;
  s public.kyc_status;
  v_reason text := nullif(trim(p_reason), '');
begin
  if auth.uid() is null or not public.current_user_has_permission('kyc.manage') then
    raise exception 'forbidden';
  end if;

  select * into k
  from public.kyc_profiles
  where id = p_kyc_id
  for update;

  if not found then
    raise exception 'kyc_not_found';
  end if;

  if k.status <> 'pending' then
    raise exception 'kyc_not_pending';
  end if;

  if p_action = 'approve' then
    if k.document_path is null or not exists (
      select 1
      from storage.objects o
      where o.bucket_id = 'kyc-documents'
        and o.name = k.document_path
        and o.owner_id = k.user_id::text
    ) then
      raise exception 'kyc_document_missing';
    end if;
    s := 'approved';
  elsif p_action = 'reject' then
    if v_reason is null or char_length(v_reason) < 5 then
      raise exception 'kyc_rejection_reason_required';
    end if;
    if char_length(v_reason) > 500 then
      raise exception 'kyc_rejection_reason_too_long';
    end if;
    s := 'rejected';
  else
    raise exception 'invalid_action';
  end if;

  update public.kyc_profiles
  set status = s,
      rejection_reason = case when s = 'rejected' then v_reason else null end,
      reviewed_at = now(),
      reviewed_by = auth.uid(),
      updated_at = now()
  where id = p_kyc_id;

  insert into public.admin_actions (admin_id, action, target_type, target_id, reason, metadata)
  values (auth.uid(), p_action, 'kyc', p_kyc_id, v_reason, jsonb_build_object('status', s::text));

  insert into public.audit_logs (actor_id, action, entity_type, entity_id, description, metadata)
  values (
    auth.uid(),
    case when p_action = 'approve' then 'approve'::public.audit_action else 'reject'::public.audit_action end,
    'kyc', p_kyc_id, 'KYC status updated', jsonb_build_object('status', s::text)
  );
end
$function$;
