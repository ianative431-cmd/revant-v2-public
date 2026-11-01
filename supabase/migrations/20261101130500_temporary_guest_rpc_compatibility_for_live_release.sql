-- Compatibility for the currently deployed Next.js release, which still
-- calls these RPCs with the anon/authenticated session. The new branch uses
-- the service-role path. Revoke these grants after that code is deployed.
grant execute on function public.create_guest_order(uuid,text,text,text,text,text,text,uuid)
to anon, authenticated;
grant execute on function public.get_guest_order(text,text)
to anon, authenticated;
