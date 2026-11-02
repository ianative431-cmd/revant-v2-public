-- Admin action history is append-only. The service role may record and
-- read actions, but should not rewrite or erase the administrative trail.
REVOKE SELECT ON TABLE public.admin_actions FROM anon;
REVOKE UPDATE, DELETE, TRUNCATE ON TABLE public.admin_actions FROM service_role;
