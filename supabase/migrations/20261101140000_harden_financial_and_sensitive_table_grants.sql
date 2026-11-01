-- Tighten direct API grants and preserve financial/audit records.
-- RLS remains the primary row-level control; these grants remove unnecessary
-- privileges even where RLS would currently deny access.

REVOKE ALL PRIVILEGES ON TABLE
  public.kyc_profiles,
  public.payments,
  public.payouts,
  public.wallets,
  public.ledger_entries,
  public.refunds,
  public.audit_logs
FROM anon;

-- KYC records are user-submitted and reviewed through trusted server actions.
REVOKE DELETE ON TABLE public.kyc_profiles FROM authenticated;

-- Financial history and audit records must be append-only / non-destructive.
REVOKE UPDATE, DELETE, TRUNCATE ON TABLE public.audit_logs FROM service_role;
REVOKE UPDATE, DELETE, TRUNCATE ON TABLE public.ledger_entries FROM service_role;

-- Server-side payment processing still needs UPDATE for verified provider events.
-- It does not need the ability to delete payment or payout history.
REVOKE DELETE, TRUNCATE ON TABLE public.payments FROM service_role;
REVOKE DELETE, TRUNCATE ON TABLE public.payouts FROM service_role;

-- Wallet balances are changed by controlled database functions, not row deletion.
REVOKE DELETE, TRUNCATE ON TABLE public.wallets FROM service_role;

-- Refund records are historical financial records; no API role may delete them.
REVOKE DELETE, TRUNCATE ON TABLE public.refunds FROM anon, authenticated, service_role;
