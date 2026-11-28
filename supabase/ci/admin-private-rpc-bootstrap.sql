\set ON_ERROR_STOP on
grant usage on schema private to authenticated, service_role;

create or replace function private.admin_finance_snapshot() returns jsonb language sql security definer as $$ select '{}'::jsonb $$;
create or replace function private.admin_operations_snapshot() returns jsonb language sql security definer as $$ select '{}'::jsonb $$;
create or replace function private.admin_overview_snapshot() returns jsonb language sql security definer as $$ select '{}'::jsonb $$;
create or replace function private.admin_shops_list(integer) returns jsonb language sql security definer as $$ select '[]'::jsonb $$;
create or replace function private.admin_user_directory(integer) returns jsonb language sql security definer as $$ select '[]'::jsonb $$;
create or replace function private.admin_set_user_suspension(uuid,boolean,text default null) returns void language sql security definer as $$ select $$;
create or replace function private.admin_update_report(uuid,text,text default null) returns void language sql security definer as $$ select $$;
create or replace function private.admin_update_payout(uuid,text,text default null) returns void language sql security definer as $$ select $$;

create or replace function public.admin_finance_snapshot() returns jsonb language sql security invoker as $$ select private.admin_finance_snapshot() $$;
create or replace function public.admin_operations_snapshot() returns jsonb language sql security invoker as $$ select private.admin_operations_snapshot() $$;
create or replace function public.admin_overview_snapshot() returns jsonb language sql security invoker as $$ select private.admin_overview_snapshot() $$;
create or replace function public.admin_shops_list(integer) returns jsonb language sql security invoker as $$ select private.admin_shops_list($1) $$;
create or replace function public.admin_user_directory(integer) returns jsonb language sql security invoker as $$ select private.admin_user_directory($1) $$;
create or replace function public.admin_set_user_suspension(uuid,boolean,text default null) returns void language sql security invoker as $$ select private.admin_set_user_suspension($1,$2,$3) $$;
create or replace function public.admin_update_report(uuid,text,text default null) returns void language sql security invoker as $$ select private.admin_update_report($1,$2,$3) $$;
create or replace function public.admin_update_payout(uuid,text,text default null) returns void language sql security invoker as $$ select private.admin_update_payout($1,$2,$3) $$;

grant execute on all functions in schema private to authenticated, service_role;
grant execute on all functions in schema public to authenticated;
