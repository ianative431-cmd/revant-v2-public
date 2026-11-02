-- Protect the legacy finance snapshot table.
-- The admin RPC reads this table under its SECURITY DEFINER owner; the
-- browser-facing roles must not read or mutate the summary directly.
ALTER TABLE public.admin_finance_summary ENABLE ROW LEVEL SECURITY;

REVOKE ALL PRIVILEGES ON TABLE public.admin_finance_summary
  FROM PUBLIC, anon, authenticated;
