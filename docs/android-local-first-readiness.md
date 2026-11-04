# Android local-first readiness — Revant

## Verified baseline (2026-11-04)

This document records the state checked against the repository, not an assumption about a completed offline implementation.

- The two Capacitor projects are `android-apps/revant` and `android-apps/super-admin`.
- Both Capacitor configurations use a remote Render `server.url`; their local `www/index.html` files are loading placeholders only.
- The GitHub Actions workflow successfully built two **debug** APK artifacts from commit `a4295eaf15913b51fbdc6ef957b61dfa525cd3fe`. Debug artifacts are not release-signed applications.
- The Super Admin PWA service worker caches only a generic offline page and the public logo. It deliberately does not cache authenticated pages or API responses.
- The local-first identity/device SQL migration and the AAL2 enforcement migration are still under `supabase/pending_migrations`. They have not been applied.
- The current Super Admin design requires Supabase Auth, TOTP/AAL2 and server-side device approval. A network outage therefore cannot authorize new privileged server actions.

## Non-negotiable security boundaries

1. Offline mode must never grant a server role, bypass Supabase Auth, bypass TOTP/AAL2, or approve a new device.
2. Payments, refunds, payouts, KYC decisions, role changes, account recovery and other irreversible/financial actions remain online-only and server-authorized.
3. Never put Supabase service-role credentials, passwords, access-key plaintext, TOTP seeds, session cookies or device bearer tokens in the local bundle, IndexedDB, logs or APK assets.
4. Local storage must be encrypted with Web Crypto. The encryption key must be derived/wrapped from a user-controlled unlock secret using a reviewed KDF and stored only in a non-exportable or wrapped form where platform support permits. Do not invent a custom cryptographic scheme.
5. Device approval/revocation and synchronization must be idempotent and auditable on the server. Revocation must invalidate future sync and online actions.
6. The service worker must remain network-first for authenticated pages and must never cache authenticated HTML, API responses, personal data, financial data or admin mutations.

## Required implementation sequence

### A. Make the Android shell honest and observable
- Keep separate application IDs: `ne.revant.marketplace` and `ne.revant.superadmin`.
- Add a visible offline/online state and last-successful-sync timestamp.
- Handle a failed remote navigation without showing a blank screen.
- Do not call the remote-WebView wrapper an autonomous offline application.
- Keep debug builds separate from signed release builds; configure signing only through protected CI secrets after explicit owner setup.

### B. Build the local Super Admin offline shell
- Package a real local UI bundle; do not use an empty `www` placeholder as the offline experience.
- Provide only a deliberately limited offline workspace: read-only, explicitly allowlisted reference data and non-financial drafts.
- Do not store or expose private admin data until the encrypted vault, device binding, expiry and logout/lock behavior have passed security review.
- Lock on app background/timeout and require local re-unlock; online operations must still obtain fresh server authorization.

### C. Encrypted outbox and controlled synchronization
- Define versioned schemas for each offline-allowed draft type.
- Store encrypted records with random IDs, schema version, creation time, device ID and idempotency key.
- Sync through authenticated server endpoints; validate role, AAL2, approved device, schema, ownership and current business rules on every request.
- Use conflict detection/version checks. Never use last-write-wins for privileged or financial records.
- Keep retry/backoff bounded and make duplicate submissions harmless.
- Provide visible per-item states: local draft, waiting, synced, conflict, rejected.

### D. Buyer/seller Revant offline scope
- Cache only public catalogue metadata and explicitly approved non-sensitive assets.
- Keep cart/order submission, messaging delivery, payments and account changes online-authoritative.
- Clearly distinguish locally saved actions from server-confirmed actions.

### E. Release gates
- Unit tests for encryption, key rotation/lock, schema validation, idempotency and conflict handling.
- Integration tests for revoked device, expired session, missing AAL2, duplicate sync, network loss mid-upload and app restart.
- Verify no sensitive cache entries using automated service-worker tests.
- Verify both apps install and launch on Android; test Samsung Android WebView/Chrome behavior.
- Produce signed release APKs/AAB only after signing credentials are configured securely and the release workflow is reviewed.

## Current blockers — do not silently skip

- No local application bundle exists yet; both `www/index.html` files are placeholders.
- The Capacitor `server.url` settings point to Render, so first launch and app content still depend on network availability.
- No encrypted local vault, offline draft outbox or synchronization API is implemented.
- The pending Supabase migrations require review and controlled application; do not apply them as part of an Android UI change.
- The current Actions artifacts are debug APKs and expire after GitHub's artifact-retention period.

## Acceptance criteria for calling the apps local-first

A network-disabled device can open the locally packaged app and unlock only its own encrypted, allowlisted offline workspace; no private data is exposed before unlock; no privileged action succeeds offline; on reconnection, only approved drafts synchronize exactly once after fresh server-side authorization; conflicts and revocations are handled safely; all of this is covered by automated tests.
