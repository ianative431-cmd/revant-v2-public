# Revant Chat security release — 13 November 2026

## Production release

- Pull request: #109 — `fix(chat): enforce conversation participant access`
- Merge commit: `17abcac727a721bd207113884cd9a68fed8a20c3`
- Render service: `revant-v2-ui-premium`
- Render deployment: `dep-dbr8dvei0phs73f45nbg`
- Deployment status: `live` (Render confirmed at 03:43:23 UTC)
- Public application: https://revant-v2-ui-premium.onrender.com

## Changes released

- Explicitly check the authenticated user is the buyer or seller before sending a text message.
- Explicitly check the authenticated user is a participant before rendering a conversation thread.
- Validate conversation and product UUID inputs and cap text messages at 2,000 characters.
- Keep existing Supabase RLS as the database-level authorization boundary.

## Validation and limitations

- Pull request CI checks: successful (install, production dependency audit, lint, tests, Next.js build).
- Render production build completed and deployment reached `live`.
- Build output confirmed Next.js compilation, TypeScript validation, and static page generation.
- Direct browser verification of `/messages` and `/qr/application` could not be completed because the browser inspection service returned an internal access error for the Render host. This is not evidence that the routes are failing.
- Render runtime-log query for the short deployment window returned no entries; deployment status itself is confirmed `live`.
- The Samsung S22 Ultra camera/gallery behavior still requires a real-device check.
- This release does not implement realtime messaging, media attachments, voice/video calls, presence, or read receipts.

## Scope safeguards

- No Supabase schema, RLS policy, credentials, or project settings were changed.
- No payment, wallet, payout, KYC, or finance code was changed.
- No Admin or Super Admin service/configuration was changed.
- No automatic deploy setting was enabled; the production deploy was explicitly triggered after CI passed.
