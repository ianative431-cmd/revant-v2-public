\set ON_ERROR_STOP on

do $block$
declare sig text;
begin
  foreach sig in array array[
    'private.admin_finance_snapshot()',
    'private.admin_operations_snapshot()',
    'private.admin_overview_snapshot()',
    'private.admin_shops_list(integer)',
    'private.admin_user_directory(integer)',
    'private.admin_set_user_suspension(uuid,boolean,text)',
    'private.admin_update_report(uuid,text,text)',
    'private.admin_update_payout(uuid,text,text)'
  ] loop
    if has_function_privilege('authenticated', sig, 'EXECUTE') then
      raise exception 'authenticated can still directly execute %', sig;
    end if;
    if has_function_privilege('anon', sig, 'EXECUTE') then
      raise exception 'anon can execute %', sig;
    end if;
    if not has_function_privilege('service_role', sig, 'EXECUTE') then
      raise exception 'service_role lost execution on %', sig;
    end if;
  end loop;

  foreach sig in array array[
    'public.admin_finance_snapshot()',
    'public.admin_operations_snapshot()',
    'public.admin_overview_snapshot()',
    'public.admin_shops_list(integer)',
    'public.admin_user_directory(integer)',
    'public.admin_set_user_suspension(uuid,boolean,text)',
    'public.admin_update_report(uuid,text,text)',
    'public.admin_update_payout(uuid,text,text)'
  ] loop
    if not has_function_privilege('authenticated', sig, 'EXECUTE') then
      raise exception 'authenticated lost public RPC %', sig;
    end if;
    if not (select prosecdef from pg_proc where oid=sig::regprocedure) then
      raise exception 'public RPC % must run SECURITY DEFINER after its permission guard', sig;
    end if;
  end loop;
end;
$block$;

select 'private admin RPCs are not directly executable; guarded public wrappers remain callable' as result;
