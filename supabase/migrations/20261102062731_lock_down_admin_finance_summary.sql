-- The legacy finance summary is a security-invoker view, not a table.
-- The admin snapshot RPC reads it as its SECURITY DEFINER owner. Browser
-- roles should not query or mutate this view directly.
REVOKE ALL PRIVILEGES ON TABLE public.admin_finance_summary
  FROM PUBLIC, anon, authenticated;
