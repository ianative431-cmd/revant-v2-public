\set ON_ERROR_STOP on

-- RLS and privilege boundaries for all private bootstrap/recovery tables.
do $$
begin
  if not (select relrowsecurity from pg_class where oid = 'public.super_admin_bootstrap_claims'::regclass)
     or not (select relrowsecurity from pg_class where oid = 'public.super_admin_bootstrap_pending'::regclass)
     or not (select relrowsecurity from pg_class where oid = 'public.super_admin_key_rotation_pending'::regclass) then
    raise exception 'recovery RLS is not enabled on every private table';
  end if;
  if has_table_privilege('anon', 'public.super_admin_bootstrap_claims', 'SELECT')
     or has_table_privilege('authenticated', 'public.super_admin_bootstrap_claims', 'SELECT')
     or has_table_privilege('anon', 'public.super_admin_bootstrap_pending', 'SELECT')
     or has_table_privilege('authenticated', 'public.super_admin_bootstrap_pending', 'SELECT')
     or has_table_privilege('anon', 'public.super_admin_key_rotation_pending', 'SELECT')
     or has_table_privilege('authenticated', 'public.super_admin_key_rotation_pending', 'SELECT') then
    raise exception 'client roles have direct access to private recovery tables';
  end if;
  if not has_table_privilege('service_role', 'public.super_admin_key_rotation_pending', 'SELECT')
     or not has_table_privilege('service_role', 'public.super_admin_key_rotation_pending', 'INSERT')
     or not has_table_privilege('service_role', 'public.super_admin_key_rotation_pending', 'UPDATE')
     or not has_table_privilege('service_role', 'public.super_admin_key_rotation_pending', 'DELETE') then
    raise exception 'service_role is missing pending-rotation privileges';
  end if;
  if has_function_privilege('anon', 'public.claim_super_admin_bootstrap(uuid,timestamptz)', 'EXECUTE')
     or has_function_privilege('authenticated', 'public.claim_super_admin_bootstrap(uuid,timestamptz)', 'EXECUTE')
     or not has_function_privilege('service_role', 'public.claim_super_admin_bootstrap(uuid,timestamptz)', 'EXECUTE')
     or has_function_privilege('anon', 'public.begin_super_admin_bootstrap(uuid,uuid,text,text,text,text,text,text,timestamptz)', 'EXECUTE')
     or has_function_privilege('authenticated', 'public.begin_super_admin_bootstrap(uuid,uuid,text,text,text,text,text,text,timestamptz)', 'EXECUTE')
     or not has_function_privilege('service_role', 'public.begin_super_admin_bootstrap(uuid,uuid,text,text,text,text,text,text,timestamptz)', 'EXECUTE') then
    raise exception 'bootstrap RPC grants are incorrect';
  end if;
end;
$$;

insert into auth.users(id,email) values
 ('00000000-0000-4000-8000-000000000001','admin1@example.test'),
 ('00000000-0000-4000-8000-000000000002','admin2@example.test');

-- One active global claim is exclusive to one account.
do $$
declare first_user uuid := '00000000-0000-4000-8000-000000000001';
        second_user uuid := '00000000-0000-4000-8000-000000000002';
        result boolean;
begin
  select public.claim_super_admin_bootstrap(first_user, now() + interval '20 minutes') into result;
  if result is distinct from true then raise exception 'first bootstrap claim failed'; end if;
  select public.claim_super_admin_bootstrap(second_user, now() + interval '20 minutes') into result;
  if result is distinct from false then raise exception 'second user incorrectly stole active claim'; end if;
  select public.claim_super_admin_bootstrap(first_user, now() + interval '20 minutes') into result;
  if result is distinct from true then raise exception 'same-user claim retry failed'; end if;
  select public.release_super_admin_bootstrap(first_user) into result;
  if result is distinct from true then raise exception 'bootstrap claim release failed'; end if;
  select public.claim_super_admin_bootstrap(second_user, now() + interval '20 minutes') into result;
  if result is distinct from true then raise exception 'claim not reusable after release'; end if;
  select public.release_super_admin_bootstrap(second_user) into result;
  if result is distinct from true then raise exception 'second claim release failed'; end if;
  select public.claim_super_admin_bootstrap(first_user, now() + interval '20 minutes') into result;
  if result is distinct from true then raise exception 'first user could not reclaim bootstrap'; end if;
end;
$$;

-- A second, different first-time setup cannot replace an active pending operation.
do $$
declare uid uuid := '00000000-0000-4000-8000-000000000001';
        op1 uuid := '10000000-0000-4000-8000-000000000001';
        op2 uuid := '10000000-0000-4000-8000-000000000002';
        result boolean;
        created_device_id uuid;
begin
  select public.begin_super_admin_bootstrap(
    uid, op1, 'Root Admin', 'root admin', repeat('a',48), repeat('a',64),
    'Primary device', repeat('e',64), now() + interval '15 minutes'
  ) into result;
  if result is distinct from true then raise exception 'first bootstrap operation did not start'; end if;

  select public.begin_super_admin_bootstrap(
    uid, op2, 'Other Admin', 'other admin', repeat('b',48), repeat('b',64),
    'Other device', repeat('f',64), now() + interval '15 minutes'
  ) into result;
  if result is distinct from false then raise exception 'concurrent different bootstrap operation was allowed'; end if;

  update public.super_admin_bootstrap_pending
     set expires_at = now() - interval '1 second'
   where user_id = uid and operation_id = op1;

  select public.begin_super_admin_bootstrap(
    uid, op2, 'Other Admin', 'other admin', repeat('b',48), repeat('b',64),
    'Other device', repeat('f',64), now() + interval '15 minutes'
  ) into result;
  if result is distinct from true then raise exception 'expired bootstrap operation could not be replaced'; end if;

  select public.finalize_super_admin_bootstrap(uid, op1) into created_device_id;
  if created_device_id is not null then raise exception 'superseded bootstrap operation was finalized'; end if;

  select public.finalize_super_admin_bootstrap(uid, op2) into created_device_id;
  if created_device_id is null then raise exception 'atomic bootstrap finalization failed'; end if;

  if exists(select 1 from public.super_admin_bootstrap_claims where id = 1)
     or exists(select 1 from public.super_admin_bootstrap_pending where user_id = uid) then
    raise exception 'bootstrap claim or pending operation was not deleted after finalization';
  end if;
  if not exists(select 1 from public.super_admin_identities where user_id = uid and access_key_digest = repeat('b',64)) then
    raise exception 'identity digest does not match the winning bootstrap operation';
  end if;
  if not exists(select 1 from public.super_admin_devices where id = created_device_id and user_id = uid
                and device_token_digest = repeat('f',64) and status = 'approved') then
    raise exception 'trusted device does not match the winning bootstrap operation';
  end if;
end;
$$;

-- Key rotation is staged, then atomically finalized into the identity.
do $$
declare uid uuid := '00000000-0000-4000-8000-000000000001';
        op uuid := '20000000-0000-4000-8000-000000000001';
        result boolean;
        actual_digest text;
        pending_count integer;
begin
  select public.begin_super_admin_key_rotation(uid, op, repeat('c',48), repeat('1',64), now() + interval '15 minutes') into result;
  if result is distinct from true then raise exception 'rotation staging failed'; end if;
  select public.finalize_super_admin_key_rotation(uid, op) into result;
  if result is distinct from true then raise exception 'rotation finalization failed'; end if;
  select access_key_digest into actual_digest from public.super_admin_identities where user_id = uid;
  if actual_digest <> repeat('1',64) then raise exception 'identity digest was not updated'; end if;
  select count(*) into pending_count from public.super_admin_key_rotation_pending where user_id = uid;
  if pending_count <> 0 then raise exception 'pending rotation row was not deleted'; end if;
end;
$$;

-- Expired staged rotations cannot be finalized.
do $$
declare uid uuid := '00000000-0000-4000-8000-000000000001';
        op uuid := '20000000-0000-4000-8000-000000000002';
        result boolean;
begin
  select public.begin_super_admin_key_rotation(uid, op, repeat('d',48), repeat('2',64), now() + interval '1 minute') into result;
  if result is distinct from true then raise exception 'second rotation staging failed'; end if;
  update public.super_admin_key_rotation_pending set expires_at = now() - interval '1 second' where user_id = uid;
  select public.finalize_super_admin_key_rotation(uid, op) into result;
  if result is distinct from false then raise exception 'expired rotation was incorrectly finalized'; end if;
end;
$$;

select 'super-admin recovery migration tests passed' as result;
