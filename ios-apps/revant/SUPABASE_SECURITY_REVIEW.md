# Revant — live Supabase security advisor review

Audit date: 2026-11-14
Project: `xugcmpnrigqfszyfufoc`
Mode: read-only. No Auth setting, SQL object, grant, RLS policy, user, or production record was changed.

## Security advisor results

### 1. RLS enabled with no policy — INFO (4 tables)

The advisor reports:
- `private.delivery_code_secrets`
- `public.receipt_documents`
- `public.super_admin_devices`
- `public.super_admin_identities`

The three public tables were checked directly: neither `anon` nor `authenticated` has SELECT; `service_role` has SELECT. The private delivery-code table is not directly readable by anon, authenticated or service_role. The private delivery-code routines are called by restricted server-side functions. This is consistent with a service-only design, not evidence that customer clients can read those tables.

### 2. SECURITY DEFINER RPCs callable by authenticated — WARN (12 functions)

The advisor lists:
- `admin_moderate_review`
- `admin_set_associate_role`
- `buyer_cancel_order`
- `driver_claim_delivery`
- `driver_confirm_delivery_code`
- `driver_list_assigned_deliveries`
- `driver_list_available_deliveries`
- `driver_update_delivery_status`
- `mark_all_notifications_read`
- `mark_notification_read`
- `seller_cancel_order`
- `seller_confirm_order`

Read-only inspection confirmed:
- All 12 public wrappers set an empty `search_path`.
- None of the 12 can be executed by `anon`.
- Each admin wrapper checks its required permission or the Super Admin role plus AAL2.
- Buyer/seller order functions verify the authenticated buyer or seller and valid order transitions.
- Driver functions delegate to private functions that verify the authenticated active driver, delivery ownership, allowed state transitions and delivery-code attempt limits.
- Notification functions constrain updates to rows owned by `auth.uid()`.

These functions are SECURITY DEFINER by design to perform tightly scoped operations. The advisor warning should remain tracked, but blindly changing them to SECURITY INVOKER would break intended server-side workflows. Continue regression tests and review every new privileged RPC for an explicit identity/ownership guard, empty or fixed search path, narrow grants and audit logging.

### 3. Leaked-password protection — WARN

Supabase Auth currently reports leaked-password protection disabled. Enable it in the Supabase Auth password-security settings after confirming the desired user-facing error behavior and testing the existing password-reset and sign-in flows. This is a dashboard Auth configuration change and was intentionally not changed during this read-only audit.

Official remediation: https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection

## Performance advisor notes

The performance advisor also reports:
- Several old backup-schema tables without primary keys under `revant_backup_p0`.
- Multiple permissive SELECT policies on some marketplace tables.
- Many indexes not yet used because the live marketplace has very little transaction activity.

These are not automatic reasons to drop indexes or change policies. Review the backup schema separately, and only optimize indexes/policies with query-plan and workload evidence. Do not make production changes solely to silence advisor notices.

## Decision

- No production changes made.
- No SECURITY DEFINER functions were modified.
- No RLS policies were weakened or removed.
- Enable leaked-password protection in a controlled Auth-settings change and regression-test it.
- Continue to track the 12 guarded SECURITY DEFINER wrappers; review any new privileged function before release.
