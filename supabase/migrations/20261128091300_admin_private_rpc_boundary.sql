-- Keep permission checks at the public RPC boundary and close direct calls
-- to SECURITY DEFINER implementation functions in the private schema.

alter function public.admin_finance_snapshot() security definer;
alter function public.admin_operations_snapshot() security definer;
alter function public.admin_overview_snapshot() security definer;
alter function public.admin_shops_list(integer) security definer;
alter function public.admin_user_directory(integer) security definer;
alter function public.admin_set_user_suspension(uuid, boolean, text) security definer;
alter function public.admin_update_report(uuid, text, text) security definer;
alter function public.admin_update_payout(uuid, text, text) security definer;

revoke all on function private.admin_finance_snapshot() from public, anon, authenticated;
revoke all on function private.admin_operations_snapshot() from public, anon, authenticated;
revoke all on function private.admin_overview_snapshot() from public, anon, authenticated;
revoke all on function private.admin_shops_list(integer) from public, anon, authenticated;
revoke all on function private.admin_user_directory(integer) from public, anon, authenticated;
revoke all on function private.admin_set_user_suspension(uuid, boolean, text) from public, anon, authenticated;
revoke all on function private.admin_update_report(uuid, text, text) from public, anon, authenticated;
revoke all on function private.admin_update_payout(uuid, text, text) from public, anon, authenticated;

grant execute on function private.admin_finance_snapshot() to service_role;
grant execute on function private.admin_operations_snapshot() to service_role;
grant execute on function private.admin_overview_snapshot() to service_role;
grant execute on function private.admin_shops_list(integer) to service_role;
grant execute on function private.admin_user_directory(integer) to service_role;
grant execute on function private.admin_set_user_suspension(uuid, boolean, text) to service_role;
grant execute on function private.admin_update_report(uuid, text, text) to service_role;
grant execute on function private.admin_update_payout(uuid, text, text) to service_role;
