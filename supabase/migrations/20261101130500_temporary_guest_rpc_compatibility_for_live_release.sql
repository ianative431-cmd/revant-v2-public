-- Preserve the public guest-checkout RPC entry points while the deployed
-- server action is upgraded. The following migrations move their elevated
-- implementations into the non-exposed private schema and switch the public
-- wrappers to SECURITY INVOKER, keeping this access safe and compatible.
grant execute on function public.create_guest_order(uuid,text,text,text,text,text,text,uuid)
to anon, authenticated;
grant execute on function public.get_guest_order(text,text)
to anon, authenticated;
