# Revant — Apple App Store readiness

Last source audit: 2026-11-14. This checklist is based on the current repository and the dedicated iOS branch. A passing simulator build is not App Store approval.

## Implemented in this branch

- [x] Dedicated SwiftUI iOS application target, separate from the Android Capacitor app and Super Admin.
- [x] iOS 26+ Liquid Glass on native navigation controls, with system-material fallback.
- [x] Native navigation for the five customer destinations; the website's duplicate header and bottom navigation are hidden only inside the iOS WKWebView.
- [x] ActivityKit/WidgetKit delivery Live Activity for Lock Screen and Dynamic Island.
- [x] ActivityKit push token registration scoped to the authenticated buyer's own order.
- [x] Signed APNs Live Activity updates wired to successful delivery-driver claim, progress and delivery-confirmation actions.
- [x] Per-category notification preferences UI and Supabase schema.
- [x] Server-side APNs device token registration; tokens are not exposed to browser clients.
- [x] GitHub Actions simulator build using Xcode 26+.

## Verified App Review blockers / unresolved work

### Account deletion — blocker
The current source tree does not expose an in-app account deletion flow or a corresponding customer-facing deletion action. Implement deletion from inside the app. Before deleting an Auth user, audit every table, storage object, financial ledger, order, KYC record and legal retention obligation. Preserve records that must legally remain while deleting or anonymizing personal data where appropriate. Do not simply cascade-delete financial history.

### User-generated content safety — blocker
The marketplace contains user-created listings, shop content and messaging. The repository has administrative moderation actions, but the source audit did not find customer-facing report-content or block-user controls. Add reporting for relevant content/accounts, a block mechanism that actually prevents further unwanted contact/content exposure, and a documented moderation response path.

### Minimum functionality — high review risk
The iOS target currently hosts the existing remote Revant customer website in WKWebView. Native navigation, push registration and delivery Live Activities add native value, but Apple Guideline 4.2 may still reject a thin website wrapper. Continue moving important customer journeys and device capabilities into meaningful native experiences and test the complete app, not only the shell.

### General push notifications — partial
This branch implements APNs device-token registration and category preferences. The Live Activity APNs path is wired to delivery state transitions. General alert pushes for messages, payments, refunds, security and promotions are not yet connected to their trusted event-creation pipeline. Do not describe all push categories as live until that integration and end-to-end device tests pass.

### Apple account and signing — external prerequisite
- Register/confirm the App ID `ne.revant.marketplace` in the Apple Developer account.
- Enable Push Notifications and use the matching provisioning profiles.
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

The migrations in this branch for APNs device tokens, notification preferences and Live Activity tokens are repository files only. They have not been applied to the live Supabase project from this workflow. Apply them only after review and verify the resulting schema/RLS with Supabase before deploying the corresponding server code.
