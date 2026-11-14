# Revant — account deletion audit for Apple review

Audit date: 2026-11-14
Target Supabase project: `xugcmpnrigqfszyfufoc`
Scope: read-only inspection of live schema and aggregate counts. No account, shop, object, session, role or database record was changed.

## Verified live account shape

- 2 Auth users and 2 matching `public.profiles` rows.
- The live profile primary key references `auth.users(id)` with `ON DELETE CASCADE`.
- One account has both `buyer` and `super_admin` roles. It must never be eligible for the ordinary customer self-service deletion flow.
- One customer-only buyer account owns one shop and four Storage objects.
- Current aggregate counts: 0 orders, 0 payments, 0 wallets, 0 ledger entries, 0 KYC profiles, 0 payouts, 0 addresses, 0 conversations, 0 messages, 0 notifications, 0 reports, 0 favorites, 0 referrals, 0 support tickets and 0 support messages.
- The live Storage buckets currently contain one object in `avatars` and three in `shop-media`.

These are aggregate counts only; no personal identifiers, email addresses, phone numbers, object paths or private file contents were read or copied into this report.

## Deletion constraints confirmed from the live schema

The database intentionally protects identity references used by marketplace and compliance records. Several tables have `ON DELETE RESTRICT` references to `public.profiles`, including addresses, conversations, delivery companies, disputes, KYC profiles, messages, payments, payouts, referrals, refunds, reports, reviews, shops, store subscriptions, support records and wallets. Other audit attribution references use `SET NULL`; favorites and notifications use `CASCADE`.

A simple `auth.admin.deleteUser()` call is therefore not a safe general deletion strategy. Deleting the Auth user cascades to its profile, and that profile deletion can be blocked by restrictive foreign keys. It also does not itself remove objects owned in Supabase Storage.

Supabase's current guidance confirms:
- Auth users must not own Storage objects at deletion time; remove objects through the Storage API, not by deleting rows from `storage.objects`.
- Revoking sessions does not make already-issued access JWTs instantly expire; they remain valid until their `exp` time. Sensitive server actions must continue to verify the live session/authorization.

## Required implementation design

1. The ordinary self-service flow must reject any account that has an administrative role, including a user who also has a buyer role. This is a guard only; it must not change Super Admin login, MFA, trusted-device or recovery behavior.
2. The user must explicitly confirm deletion and reauthenticate using a method appropriate to the account's sign-in providers.
3. Before any destructive operation, the server must run a preflight against every restrictive FK and every business obligation: shop ownership, orders, payments, refunds, disputes, wallet balances, ledger entries, payouts, KYC, support and moderation history.
4. If any non-deletable obligation exists, the app must create a durable deletion request and clearly explain the specific step needed (for example, shop transfer/closure or resolution of an open financial case). It must not silently reject the request or ask the user to email support as the only path.
5. For eligible accounts, delete the user's Storage objects using the Storage API, then delete permitted user-owned rows in a controlled order, revoke sessions, and delete the Auth user. Keep required financial, legal and fraud-prevention records only under a documented retention basis and anonymize where the data model safely permits.
6. Preserve a minimal, non-identifying deletion audit record with requester reference set to null after deletion. Never retain raw passwords, OTPs, access tokens, APNs tokens or Storage object URLs in the request log.
7. The final deletion operation must be idempotent, protected against concurrent requests, and verified by read-back queries: Auth user absent, profile absent, user-owned Storage objects absent, no active push tokens, and the request audit record retained without personal data.

## Migration-history blocker — do not bypass

The repository's `supabase/MIGRATION_HISTORY.md` records 29 remote migration versions whose SQL source files have not been recovered. It explicitly prohibits `supabase db push`, guessing missing SQL, or replaying archived migrations.

The Apple branch also contains new migrations for push tokens, notification preferences, Live Activity tokens and user blocks. These are not yet present in the live database. Do not deploy server code that depends on those tables until the migration history is reconciled and each required migration has been reviewed and applied deliberately.

## Current outcome

- Read-only audit complete.
- No deletion implementation has been enabled yet.
- No live data or Supabase schema changed.
- The current shop-owning buyer account cannot be hard-deleted safely until the shop and four owned Storage objects are handled.
- The account holding `super_admin` must be excluded from customer self-service deletion.
- Next engineering task: design and test the durable deletion-request workflow and the eligible-account deletion executor on an isolated staging database, then run the Supabase security advisors before any production migration.
