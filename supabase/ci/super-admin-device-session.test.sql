\set ON_ERROR_STOP on

insert into public.permissions(id, key) values
 ('30000000-0000-4000-8000-000000000001', 'settings.manage'),
 ('30000000-0000-4000-8000-000000000002', 'support.manage'),
 ('30000000-0000-4000-8000-000000000003', 'products.view');

insert into public.user_roles(user_id, role) values
 ('00000000-0000-4000-8000-000000000001', 'super_admin'),
 ('00000000-0000-4000-8000-000000000002', 'admin'),
 ('00000000-0000-4000-8000-000000000003', 'associate');

insert into public.role_permissions(role, permission_id) values
 ('super_admin', '30000000-0000-4000-8000-000000000001'),
 ('super_admin', '30000000-0000-4000-8000-000000000002'),
 ('admin', '30000000-0000-4000-8000-000000000002'),
 ('associate', '30000000-0000-4000-8000-000000000003');

do $$
begin
  if has_function_privilege('anon', 'public.has_any_admin_role()', 'EXECUTE')
     or has_function_privilege('anon', 'public.current_user_has_permission(text)', 'EXECUTE')
     or has_function_privilege('anon', 'private.is_current_super_admin_device_trusted()', 'EXECUTE')
     or has_function_privilege('anon', 'public.admin_approve_super_admin_device(uuid)', 'EXECUTE')
     or has_function_privilege('anon', 'public.admin_revoke_super_admin_device(uuid)', 'EXECUTE') then
    raise exception 'anonymous role can execute an admin security function';
  end if;
  if not has_function_privilege('authenticated', 'public.has_any_admin_role()', 'EXECUTE')
     or not has_function_privilege('authenticated', 'public.current_user_has_permission(text)', 'EXECUTE')
     or not has_function_privilege('authenticated', 'public.admin_approve_super_admin_device(uuid)', 'EXECUTE') then
    raise exception 'authenticated role is missing required function execution';
  end if;
end;
$$;

-- A Super Admin with AAL2 but no approved device-bound session is denied.
begin;
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000001', true);
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-000000000001","role":"authenticated","aal":"aal2","session_id":"10000000-0000-4000-8000-000000000001"}', true);
do $$
begin
  if public.has_any_admin_role() then raise exception 'Super Admin without trusted device was accepted'; end if;
  if public.current_user_has_permission('settings.manage') then raise exception 'Super Admin without trusted device received a permission'; end if;
  begin
    perform public.admin_operations_snapshot();
    raise exception 'admin_operations_snapshot accepted an untrusted device';
  exception when others then
    if sqlerrm = 'admin_operations_snapshot accepted an untrusted device' then raise; end if;
    if sqlerrm <> 'forbidden' then raise; end if;
  end;
  begin
    perform public.admin_set_associate_role('00000000-0000-4000-8000-000000000004', true, null);
    raise exception 'admin_set_associate_role accepted an untrusted device';
  exception when others then
    if sqlerrm = 'admin_set_associate_role accepted an untrusted device' then raise; end if;
    if sqlerrm <> 'forbidden' then raise; end if;
  end;
  begin
    perform private.admin_set_associate_role('00000000-0000-4000-8000-000000000004', true, null);
    raise exception 'private admin_set_associate_role accepted an untrusted device';
  exception when others then
    if sqlerrm = 'private admin_set_associate_role accepted an untrusted device' then raise; end if;
    if sqlerrm <> 'forbidden' then raise; end if;
  end;
  begin
    perform private.admin_update_payout('20000000-0000-4000-8000-000000000003', 'approve', null);
    raise exception 'private admin_update_payout accepted an untrusted device';
  exception when others then
    if sqlerrm = 'private admin_update_payout accepted an untrusted device' then raise; end if;
    if sqlerrm <> 'forbidden' then raise; end if;
  end;
end;
$$;
reset role;
commit;

insert into public.super_admin_devices(id,user_id,device_name,device_token_digest,status,approved_at,session_id)
values (
 '20000000-0000-4000-8000-000000000001',
 '00000000-0000-4000-8000-000000000001',
 'Trusted primary device',
 repeat('a',64),
 'approved', now(),
 '10000000-0000-4000-8000-000000000001'
);

-- The exact approved device session with AAL2 is accepted.
begin;
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000001', true);
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-000000000001","role":"authenticated","aal":"aal2","session_id":"10000000-0000-4000-8000-000000000001"}', true);
do $$
begin
  if not public.has_any_admin_role() then raise exception 'trusted Super Admin session was rejected'; end if;
  if not public.current_user_has_permission('settings.manage') then raise exception 'trusted Super Admin permission was rejected'; end if;
  if public.admin_operations_snapshot() <> jsonb_build_object('trusted', true) then raise exception 'trusted Super Admin operations snapshot was rejected'; end if;
  perform public.admin_set_associate_role('00000000-0000-4000-8000-000000000004', true, null);
  perform private.admin_set_associate_role('00000000-0000-4000-8000-000000000004', true, null);
  perform private.admin_update_payout('20000000-0000-4000-8000-000000000003', 'approve', null);
end;
$$;
reset role;
commit;

-- A different session cannot reuse the trusted device record.
begin;
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000001', true);
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-000000000001","role":"authenticated","aal":"aal2","session_id":"10000000-0000-4000-8000-000000000002"}', true);
do $$
begin
  if public.has_any_admin_role() then raise exception 'unbound session reused a trusted device'; end if;
  if public.current_user_has_permission('settings.manage') then raise exception 'unbound session received Super Admin permission'; end if;
end;
$$;
reset role;
commit;

-- A trusted session without AAL2 remains denied.
begin;
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000001', true);
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-000000000001","role":"authenticated","aal":"aal1","session_id":"10000000-0000-4000-8000-000000000001"}', true);
do $$
begin
  if public.has_any_admin_role() then raise exception 'Super Admin session without AAL2 was accepted'; end if;
end;
$$;
reset role;
commit;

-- Associates retain their deliberately limited permission matrix.
begin;
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000003', true);
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-000000000003","role":"authenticated","aal":"aal1","session_id":"10000000-0000-4000-8000-000000000003"}', true);
do $$
begin
  if public.has_any_admin_role() then raise exception 'associate was incorrectly treated as a full admin'; end if;
  if not public.current_user_has_permission('products.view') then raise exception 'associate lost its products.view permission'; end if;
  if public.current_user_has_permission('settings.manage') then raise exception 'associate received an unassigned permission'; end if;
end;
$$;
reset role;
commit;

-- A non-Super-Admin administrator remains governed by the permission matrix.
begin;
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000002', true);
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-000000000002","role":"authenticated","aal":"aal1","session_id":"10000000-0000-4000-8000-000000000004"}', true);
do $$
begin
  if not public.has_any_admin_role() then raise exception 'regular admin was incorrectly denied'; end if;
  if not public.current_user_has_permission('support.manage') then raise exception 'regular admin lost support.manage'; end if;
  if public.current_user_has_permission('settings.manage') then raise exception 'regular admin received unassigned settings.manage'; end if;
end;
$$;
reset role;
commit;

-- Only the trusted Super Admin session can approve or revoke devices.
insert into public.super_admin_devices(id,user_id,device_name,device_token_digest,status)
values (
 '20000000-0000-4000-8000-000000000002',
 '00000000-0000-4000-8000-000000000001',
 'New laptop',
 repeat('b',64),
 'pending'
);

begin;
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000001', true);
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-000000000001","role":"authenticated","aal":"aal2","session_id":"10000000-0000-4000-8000-000000000001"}', true);
select public.admin_approve_super_admin_device('20000000-0000-4000-8000-000000000002');
do $$
begin
  begin
    perform public.admin_revoke_super_admin_device('20000000-0000-4000-8000-000000000001');
    raise exception 'current trusted device revocation unexpectedly succeeded';
  exception when others then
    if sqlerrm = 'current trusted device revocation unexpectedly succeeded' then raise; end if;
    if sqlerrm <> 'cannot_revoke_current_device' then raise; end if;
  end;
  perform public.admin_revoke_super_admin_device('20000000-0000-4000-8000-000000000002');
end;
$$;
reset role;
commit;

do $$
begin
  if not exists (
    select 1 from public.super_admin_devices
    where id = '20000000-0000-4000-8000-000000000002'
      and status = 'revoked' and session_id is null
  ) then
    raise exception 'approved device was not revoked correctly';
  end if;
  if (select count(*) from public.admin_actions where action in ('super_admin_device_approved','super_admin_device_revoked')) <> 2 then
    raise exception 'device actions were not fully journaled';
  end if;
  if (select count(*) from public.audit_logs where entity_type='super_admin_device') <> 2 then
    raise exception 'device audit log entries are missing';
  end if;
end;
$$;

select 'super-admin trusted session boundary tests passed' as result;
