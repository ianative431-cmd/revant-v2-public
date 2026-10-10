-- Execute the public RPC as its owner so it can call the private implementation.
-- The private implementation continues to enforce auth.uid() and has_any_admin_role().
CREATE OR REPLACE FUNCTION public.admin_overview_snapshot()
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
AS $function$
  SELECT private.admin_overview_snapshot();
$function$;

-- Keep the RPC restricted to trusted Supabase roles; never expose it to anonymous users.
REVOKE ALL ON FUNCTION public.admin_overview_snapshot() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.admin_overview_snapshot() FROM anon;
GRANT EXECUTE ON FUNCTION public.admin_overview_snapshot() TO authenticated, service_role;
