# Revant — Apple App Store readiness

Last source and live-schema audit: 2026-11-14. A passing simulator build is not App Store approval.

## Implemented in this branch

- [x] Dedicated SwiftUI iOS application target, separate from the Android Capacitor app and Super Admin.
- [x] iOS 26+ Liquid Glass on native navigation controls, with system-material fallback.
- [x] Native navigation for the five customer destinations; the website's duplicate header and bottom navigation are hidden only inside the iOS WKWebView.
- [x] ActivityKit/WidgetKit delivery Live Activity for Lock Screen and Dynamic Island.
- [x] ActivityKit push token registration scoped to the authenticated buyer's own order.
- [x] Signed APNs Live Activity updates wired to successful delivery-driver claim, progress and delivery-confirmation actions.
- [x] Per-category notification preferences and Supabase schema.
- [x] Server-side APNs device-token registration, current-device token cleanup on customer sign-out, and preference-aware APNs alerts for order and delivery events.
- [x] Customer-facing report controls for products, shops and seller accounts, using the existing RLS-protected `public.reports` table.
- [x] Role-protected Admin signalement review queue; linked from the dashboard only for staff with `products.manage`.
- [x] User blocking and unblocking from conversations, with database RLS preventing new conversations, message sending and message visibility while a block is active.
- [x] GitHub Actions simulator build using Xcode 26+.

## Verified App Review blockers / unresolved work

### Account deletion — blocker
The current source tree does not expose an in-app account deletion flow or a corresponding customer-facing deletion action. The live schema has many restrictive foreign keys from historical, financial and operational records to profiles, plus Storage objects. Implement deletion from inside the app only after auditing every table, ledger, order, KYC record, audit record and owned Storage object. Preserve records that must legally remain while deleting or anonymizing personal data where appropriate. Do not simply cascade-delete financial history or Auth users.

### User-generated content safety — substantially improved, still requires testing
The active Supabase project already contains `public.reports` with RLS policies allowing authenticated users to submit reports for user, shop, product, review, message and order targets, and to read their own reports. This branch adds customer report controls for products, shops and seller accounts, plus an Admin review queue. It also adds user blocking/unblocking and enforces blocks at the database boundary for conversations and messages. Test both block directions, direct API attempts, unblocking, and Admin report resolution against the migrated database before release.

### Minimum functionality — high review risk
The iOS target currently hosts the existing remote Revant customer website in WKWebView. Native navigation, APNs alerts, content reporting/blocking and delivery Live Activities add native value, but Apple Guideline 4.2 may still reject a thin website wrapper. Continue moving important customer journeys and device capabilities into meaningful native experiences and test the complete app, not only the shell.

### General push notifications — partial
Preference-aware APNs alerts are wired for seller order confirmation/cancellation and delivery assignment/progress/completion. General alert pushes for messages, payment, refunds, security and promotions still need their trusted event handlers connected. Do not describe every category as live until those integrations and physical-device tests pass.

### Apple account and signing — external prerequisite
- Register/confirm the App ID `ne.revant.marketplace` in the Apple Developer account.
- Enable Push Notifications and use matching development/distribution provisioning profiles.
- Create an APNs authentication key and configure the server-only variables documented in README.md.
- Build and test on a physical iPhone; a simulator build cannot validate APNs or Dynamic Island behavior.
- Create a signed archive and upload through App Store Connect after all checks pass.

### Sign-in — policy review
The customer app currently has first-party email/phone account methods and Google sign-in. Confirm the applicable exception under App Review Guideline 4.8 for the first-party sign-in system. If the exception does not apply to the final login flow, add Sign in with Apple. Do not assume Google alone determines the requirement.

### Payments — policy review
Physical goods sold through the marketplace can use the normal payment processor. Digital services consumed in the app—such as seller subscriptions, premium digital features or paid boosts—need a separate Apple In-App Purchase assessment before they are enabled in the iOS app. Do not route digital entitlements through Moneroo without confirming the applicable Apple rules.

### Privacy and SDKs
- Inventory every native SDK, web SDK, analytics provider and data flow actually shipped in the final binary.
- Add/verify privacy manifests and required-reason API declarations for any SDKs that Apple lists as requiring them.
- Complete App Store privacy labels, public privacy policy, data retention/deletion disclosures and permission-purpose strings.
- Recheck this inventory whenever dependencies or analytics SDKs change.

### Store submission materials
- Confirm a 1024×1024 App Store icon based on the approved Revant logo.
- Prepare current iPhone screenshots, description, keywords, age rating and support/privacy URLs.
- Provide a reviewer account and precise review notes for customer, seller and delivery flows.
- Test on supported iPhone sizes, iOS 26, VoiceOver, Dynamic Type, dark mode, poor connectivity and permission-denied states.

## Supabase deployment status

The migrations in this branch for APNs device tokens, notification preferences, Live Activity tokens and user blocks are repository files only. They have not been applied to the live Supabase project from this workflow. The existing `public.reports` table and its RLS policies were inspected read-only. Apply the new migrations only after review and verify the resulting schema/RLS with Supabase before deploying the corresponding server code.
