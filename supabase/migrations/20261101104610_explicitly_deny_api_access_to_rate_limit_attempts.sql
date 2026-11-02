-- This table is only for trusted server-side rate limiting.
-- Explicitly deny both Data API roles; service_role and postgres retain
-- their trusted server-side access.
create policy "deny_api_roles"
on public.rate_limit_attempts
as restrictive
for all
to anon, authenticated
using (false)
with check (false);
