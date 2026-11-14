# Revant for iOS

This is the dedicated native iOS application target. It is intentionally separate from the Android Capacitor project and from the Revant Super Admin app.

## Current implementation

- SwiftUI application shell with native navigation for Accueil, Catégories, Messages, Panier and Mon compte.
- On iOS 26 and later, the native navigation controls use the system Liquid Glass material. Older supported iOS versions use a system-material fallback.
- WKWebView loads the existing Revant customer marketplace at `https://revant-v2-ui-premium.onrender.com`, with the website header and bottom navigation hidden so the native navigation is not duplicated.
- Native camera/photo-library purpose strings are declared for the marketplace's product-photo upload and search flows.
- A restricted JavaScript bridge exposes push-permission requests and delivery Live Activity start/end actions to the customer web app.
- ActivityKit and a WidgetKit extension render delivery progress on the Lock Screen and Dynamic Island on supported iPhones.
- ActivityKit push tokens are registered against the authenticated buyer's own order. Successful delivery-driver claim, progress and delivery-confirmation transitions send signed APNs Live Activity updates.
- APNs alert notifications for order confirmation/cancellation and delivery assignment/progress/completion respect the user's saved category preferences.
- Per-category notification preferences and APNs device-token registration are stored server-side.

## Required protected server configuration

Configure these variables in the server environment only; never commit them:
- `APNS_TEAM_ID`
- `APNS_KEY_ID`
- `APNS_PRIVATE_KEY` (the complete Apple .p8 private key)
- `APNS_BUNDLE_ID=ne.revant.marketplace`
- `APNS_ENVIRONMENT=sandbox` for development builds, then `production` for App Store builds.

The Apple Developer App ID must enable Push Notifications and the distribution provisioning profile must include the capability. Live Activities also require `NSSupportsLiveActivities` in the app Info.plist. Physical-device tests are required; simulator builds do not prove APNs delivery or Dynamic Island behavior.

## Important limits before App Store release

This is a native foundation, not a claim of App Store approval. The marketplace content is still served by the website. Apple may reject an app that is only a repackaged website; native customer flows and meaningful app-specific functionality must continue to be expanded and reviewed against App Review Guideline 4.2.

The following remain in the App Store compliance checklist:
1. Complete account deletion inside the app, with safe handling of financial/legal retention.
2. Customer reporting and blocking controls for user-generated content and abusive accounts.
3. Confirm the applicable Sign in with Apple exception or implement Sign in with Apple if required.
4. Decide Apple In-App Purchase treatment for digital seller subscriptions and paid boosts; physical-goods checkout remains a separate category.
5. Verify privacy manifests and privacy disclosures for every shipped SDK and service.
6. Configure App Store Connect metadata, screenshots, privacy labels, age rating, reviewer account and review notes.

General APNs alerts for message, payment, security and promotion events still need their corresponding trusted event handlers to be connected. The preferences for those categories are stored but are not yet active for every event type.

## Build locally

On macOS with Xcode 26 or later:

```sh
brew install xcodegen
xcodegen generate --spec project.yml
xcodebuild -project Revant.xcodeproj -scheme Revant -sdk iphonesimulator -destination 'generic/platform=iOS Simulator' CODE_SIGNING_ALLOWED=NO build
```

Do not add signing credentials to the repository. Use protected CI secrets and the Apple Developer portal for a distribution build.
