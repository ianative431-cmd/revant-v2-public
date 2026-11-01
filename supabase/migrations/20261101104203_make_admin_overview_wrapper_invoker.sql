-- Keep the public RPC callable by authenticated sessions without running
-- the public wrapper with elevated privileges. The private implementation
-- remains SECURITY DEFINER and performs its own auth.uid()/admin-role check.
create or replace function public.admin_overview_snapshot()
returns jsonb
language sql
security invoker
set search_path to ''
as $function$
  select private.admin_overview_snapshot();
$function$;
