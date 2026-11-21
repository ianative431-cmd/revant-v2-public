# Revant Android wrapper

The Android wrapper loads the production web application from Render. Capacitor plugins used by the web application must also be installed in this wrapper and synced into the native project.

## Google OAuth PKCE return

The app uses the registered custom URL scheme generated from the Capacitor app ID:

`ne.revant.marketplace://auth/callback`

The Google OAuth flow is opened in a Capacitor Browser Custom Tab. The callback is received by `@capacitor/app` and exchanged in the original WebView so the PKCE verifier stored there is available.

Before testing, add this exact redirect URI to Supabase Auth → URL Configuration → Additional Redirect URLs:

`ne.revant.marketplace://auth/callback`

Do not replace the Supabase Google provider callback URL configured in Google Cloud. Google still redirects to the Supabase Auth callback; Supabase then redirects to the app scheme.

## Generate and build Android locally

From this directory:

```sh
npm install
npx cap add android
npx cap sync android
npm run configure:deep-link
cd android
./gradlew assembleDebug
```

The repository's Android build workflow performs the same generation and build on GitHub Actions. The generated `android/` directory is build output and is not committed; the package manifest and Capacitor config are the source of truth.

A newly generated APK is required: an older installed APK without the App and Browser native plugins cannot complete this flow.

The web bundle and Android wrapper now use Capacitor 8 (core/Android/CLI 8.6.2, App 8.1.2, Browser 8.0.5). Keep these major versions aligned when updating the native wrapper.
