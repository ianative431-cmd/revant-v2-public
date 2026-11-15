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


## Vérification complémentaire du dépôt — 15 novembre 2026

Cette section corrige le périmètre de l'ancien état de référence du 4 novembre. Elle décrit les fichiers présents dans `main` après le commit `52a65f2`; elle ne prétend pas qu'un test sur appareil réel ou une nouvelle inspection de la base Supabase a été exécuté.

### 1. Application Revant — constat actuel

- `android-apps/revant/capacitor.config.ts` conserve `server.url` vers `https://revant-v2-ui-premium.onrender.com/?source=android-app`.
- `android-apps/revant/www/index.html` reste un écran d'attente « Ouverture de Revant… » et ne contient pas le catalogue ni l'interface marketplace.
- L'application Android Revant dépend donc encore du réseau pour charger son interface principale. Elle n'est pas autonome hors ligne.
- Identifiant natif conservé : `ne.revant.marketplace`.

### 2. Super Admin — constat actuel

- `android-apps/super-admin/capacitor.config.ts` n'a pas de `server.url` : le WebView démarre sur le fichier local `www/index.html`.
- Ce fichier embarque un écran local autonome avec coffre IndexedDB chiffré par Web Crypto : AES-GCM 256 bits, clé dérivée par PBKDF2-SHA-256 avec 600 000 itérations, sel aléatoire de 16 octets et IV aléatoire de 12 octets.
- Le coffre accepte uniquement des brouillons locaux non sensibles (100 maximum, 4 000 caractères par contenu). Il se verrouille après 10 minutes d'inactivité et lorsque l'application passe en arrière-plan.
- Le raccourci vers l'administration réelle reste conditionné à `navigator.onLine`, puis redirige vers `/admin-connexion`. L'indicateur réseau ne prouve pas à lui seul que le serveur est joignable.
- L'écran local n'accorde aucun rôle, ne contourne pas Supabase Auth/MFA et ne synchronise aucun brouillon. Il ne constitue pas encore l'application Super Admin complète.
- Identifiant natif conservé : `ne.revant.superadmin`.

### 3. PWA Super Admin web

- `public/admin/sw.js` est limité à la navigation de l'espace `/admin` : il met en cache la page hors ligne générique et le logo Super Admin.
- Les requêtes API ne sont pas mises en cache ; les navigations authentifiées sont réseau d'abord et retombent sur la page hors ligne générique. Ne pas élargir ce cache aux pages privées, aux réponses API ou aux données administratives.

### 4. Construction Android et dépendances

- Les deux projets Capacitor utilisent actuellement Capacitor Core/Android 7.4.3 et génèrent le projet Android pendant le workflow avec `npx cap add android`.
- Le workflow `.github/workflows/android-apks.yml` construit `assembleDebug` pour les deux applications. Il ne produit pas d'APK release signé ni d'AAB signé.
- Le contrôle de taille de 60 MB existe dans ce workflow ; il s'agit d'un garde-fou CI existant, pas d'une preuve que 60 MB est le budget final optimal.
- Le paquet web principal est une application Next.js 16.4.4 / React 19.3.1 avec `next build` puis `next start`. Le dépôt n'est pas configuré comme un export statique complet. Un simple `output: export` ne peut donc pas être ajouté sans traiter les pages serveur, les Server Actions, les sessions et les fonctions Supabase.

### 5. État des fonctionnalités local-first

| Capacité | Revant Android | Super Admin Android |
|---|---|---|
| Démarrage de l'interface sans réseau | Non, interface chargée depuis Render | Oui, écran local limité |
| Coffre local chiffré | Non | Oui, brouillons non sensibles uniquement |
| Catalogue public hors ligne | Non | Sans objet |
| Données privées administratives hors ligne | Non | Non |
| Appareils approuvés et révocables dans l'app locale | Non implémenté | Non connecté au coffre local |
| Synchronisation idempotente des brouillons | Non | Non |
| Opérations financières/administratives privilégiées hors ligne | Interdit | Interdit |

### 6. Suite technique recommandée

1. Cartographier les routes et dépendances Next.js qui nécessitent un serveur, puis isoler un shell mobile local pour les écrans qui peuvent réellement fonctionner sans SSR.
2. Pour Revant, commencer par les ressources publiques autorisées (shell, catégories, catalogue public et assets validés) ; afficher clairement les états hors ligne et ne jamais présenter une commande locale comme confirmée par le serveur.
3. Pour Super Admin, conserver le coffre actuel comme brouillon local non sensible. Concevoir séparément l'enrôlement et la révocation d'appareils, l'outbox chiffrée et la synchronisation authentifiée ; chaque opération en ligne doit refaire les contrôles rôle, AAL2, appareil approuvé, schéma, propriété et idempotence côté serveur.
4. Tester la révocation, l'expiration de session, l'absence d'AAL2, les doublons, les conflits, la perte réseau et le redémarrage avant toute synchronisation de données.
5. Ne pas appliquer de migration, modifier les secrets, changer les rôles ou activer des opérations financières hors ligne dans cette tranche d'audit.

Aucune modification de code Android, de configuration Render, de secret, de migration Supabase, de rôle ou de paiement n'a été réalisée pendant cette vérification documentaire.
