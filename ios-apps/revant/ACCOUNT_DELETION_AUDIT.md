# Revant — account deletion audit and implementation status

Audit date: 2026-11-14
Target Supabase project: `xugcmpnrigqfszyfufoc`

## Verified live account shape

- 2 Auth users and 2 matching `public.profiles` rows.
- The live profile primary key references `auth.users(id)` with `ON DELETE CASCADE`.
- One account has both `buyer` and `super_admin` roles. It must never be eligible for the ordinary customer self-service deletion flow.
- One customer-only buyer account owns one shop and four Storage objects.
- Current aggregate counts: 0 orders, 0 payments, 0 wallets, 0 ledger entries, 0 KYC profiles, 0 payouts, 0 addresses, 0 conversations, 0 messages, 0 notifications, 0 reports, 0 favorites, 0 referrals, 0 support tickets and 0 support messages.
- The live Storage buckets currently contain one object in `avatars` and three in `shop-media`.

These are aggregate counts only; no personal identifiers, email addresses, phone numbers, object paths or private file contents were read or copied into this report.

## Deletion constraints confirmed from the live schema

Several tables have restrictive references to `public.profiles`, including addresses, conversations, delivery companies, disputes, KYC profiles, messages, payments, payouts, referrals, refunds, reports, reviews, shops, store subscriptions, support records and wallets. Other audit attribution references use `SET NULL`; favorites and notifications use `CASCADE`.

A simple `auth.admin.deleteUser()` call is not a safe general deletion strategy. Deleting the Auth user cascades to its profile, and profile deletion can be blocked by restrictive foreign keys. Auth deletion also does not itself remove objects owned in Supabase Storage.

## Implemented in the Apple feature branch

- Customer account page now links to `/compte/suppression`.
- The deletion screen requires an explicit typed confirmation phrase.
- Server actions re-check the authenticated account and current role; any administrative role is excluded, including a buyer who also has an admin role.
- A pending SQL migration defines a minimal deletion-request log and three scoped RPCs: request, read own request, cancel own request.
- The request RPC dynamically scans restrictive foreign keys to `profiles.id` and `auth.users.id`, categorizes blockers, and checks user-owned Storage objects.
- The workflow only records or cancels a request. It never deletes Auth, profiles, shops, financial records, KYC, messages or Storage objects.
- The screen is disabled by default. It requires `ACCOUNT_DELETION_REQUESTS_ENABLED=true` only after the pending migration has been reviewed and applied deliberately.

## Migration-history blocker — do not bypass

The repository's `supabase/MIGRATION_HISTORY.md` records 29 remote migration versions whose SQL source files have not been recovered. It explicitly prohibits `supabase db push`, guessing missing SQL, or replaying archived migrations.

The Apple branch also contains migrations for push tokens, notification preferences, Live Activity tokens and user blocks. Those are not yet present in the live database. The new account-deletion SQL is deliberately stored under `supabase/pending_migrations/`, not `supabase/migrations/`. Do not run `supabase db push` or enable the feature flag until the migration history is reconciled and each migration has been reviewed and applied deliberately.

## Still required before App Store submission

1. Review and apply the pending request migration through the controlled migration-reconciliation process.
2. Build a permission-limited Admin queue to review and resolve deletion requests; never grant associates or finance staff broader access than their existing permissions.
3. Implement a separate, reauthenticated final-deletion executor, with Storage API cleanup, ownership transfer/closure, legal retention, idempotency and audit verification. This executor is not implemented here.
4. Test with synthetic accounts on an isolated staging database, including buyer, seller, shop owner, financial history, KYC, storage ownership and multi-role admin cases.
5. Enable the feature flag only after the above tests and a deliberate migration rollout.

## Current outcome

- Request-only customer UI and server actions added to the isolated Apple branch.
- SQL migration is pending and not applied to the live Supabase project.
- No user, profile, shop, object, session, role or production record changed.
- Super Admin authentication, MFA, trusted devices and recovery logic were not modified.
- No merge or deployment performed.
