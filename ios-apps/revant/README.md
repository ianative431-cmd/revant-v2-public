# Revant for iOS

This is the dedicated native iOS application target. It is intentionally separate from the Android Capacitor project and from the Revant Super Admin app.

## Current implementation

- SwiftUI application shell with native navigation for Accueil, Catégories, Messages, Panier and Mon compte.
- On iOS 26 and later, the native navigation controls use the system Liquid Glass material. Older supported iOS versions use a system material fallback.
- WKWebView loads the existing Revant customer marketplace at `https://revant-v2-ui-premium.onrender.com`.
- A restricted JavaScript bridge exposes push-permission requests and order Live Activity start/end actions to the customer web app.
- ActivityKit and a WidgetKit extension render delivery progress on the Lock Screen and Dynamic Island on supported iPhones.
- APNs permission and device-token registration are prepared. The web application stores the authenticated user's device token through a server-side endpoint.

## Important limits before App Store release

This is a buildable native foundation, not a claim of App Store approval. The current marketplace content is still served by the website. Apple may reject an app that is only a repackaged website; native customer flows and meaningful app-specific functionality must be tested and expanded.

Remote push delivery and remote Live Activity updates still require:
1. An Apple Developer account and the `ne.revant.marketplace` App ID with Push Notifications enabled.
2. A distribution provisioning profile and APNs authentication key.
3. Secure APNs sender configuration on the server and integration with the actual order/message/payment notification events.
4. End-to-end tests on a physical iPhone. Simulator builds do not prove APNs delivery or Dynamic Island behavior.

The app currently starts or updates a delivery Live Activity when the customer explicitly taps the tracking action in the order list. Background updates from the server are a separate APNs/ActivityKit integration step.

## Build locally

On macOS with Xcode 26 or later:

```sh
brew install xcodegen
xcodegen generate --spec project.yml
xcodebuild -project Revant.xcodeproj -scheme Revant -sdk iphonesimulator -destination 'generic/platform=iOS Simulator' CODE_SIGNING_ALLOWED=NO build
```

Do not add signing credentials to the repository. Use protected CI secrets and the Apple Developer portal for a distribution build.
