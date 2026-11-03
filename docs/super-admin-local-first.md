# Super Admin Revant — local-first

## Décisions
- Connexion quotidienne indépendante de Google : nom, prénom, clé d'accès personnelle et mot de passe.
- Supabase Auth reste l'unique autorité du mot de passe. La clé personnelle est un secret secondaire aléatoire de 256 bits, stocké sous forme de condensat salé ; aucun mot de passe personnalisé n'est stocké.
- Première configuration : authentification temporaire avec le compte Supabase déjà doté du rôle `super_admin`, puis inscription et vérification d'un facteur TOTP. Google OAuth n'est pas proposé dans les écrans Super Admin.
- MFA TOTP et appareil approuvé obligatoires pour le Super Admin ; les gardes serveur et la migration AAL2 doivent être actifs avant l'ouverture de la production.
- Chaque navigateur possède un cookie de confiance HttpOnly, Secure en production, SameSite=Strict. Le premier appareil est approuvé pendant la configuration ; les suivants attendent une validation depuis un appareil déjà approuvé. Révocation disponible dans Sécurité → Appareils.
- Les rôles acheteur/vendeur et leur connexion Google ne sont pas modifiés.

## Identité visuelle
Palette issue du fichier Drive `Palette super admin` : `#171013`, `#203426`, `#485330`, `#687650`. Le logo dédié fourni dans Drive est utilisé pour l'espace privé et son manifeste installable.

## PWA dédiée
- Manifeste `public/admin/manifest.webmanifest` et service worker `public/admin/sw.js`, portée limitée à `/admin/`.
- Le service worker ne met jamais en cache les pages authentifiées, API, commandes, données personnelles ou réponses administratives. Il ne conserve qu'une page hors ligne générique et le logo.
- Installation après déploiement et migration : ouvrir `/admin/`, puis utiliser « Installer l'application » dans le menu du navigateur sur Android/Chrome ou l'option d'installation de la barre d'adresse sur ordinateur.

## Limite hors ligne de cette première tranche
Cette version fournit l'installation PWA et un écran hors ligne sûr, mais ne synchronise pas encore les données administratives et ne permet pas de valider des opérations hors connexion. Les données privées ne sont volontairement pas mises en cache. La tranche suivante doit ajouter un coffre local chiffré (IndexedDB/WebCrypto), un jeu de données hors ligne explicitement autorisé, une file de brouillons non financiers et une synchronisation idempotente côté serveur. Les paiements, retraits, KYC, rôles et actions irréversibles resteront en ligne et validés par le serveur.

## Migrations — non appliquées
`supabase/pending_migrations/20261103150000_super_admin_local_first.sql` crée les tables privées `super_admin_identities` et `super_admin_devices`. Elle reste dans `pending_migrations` pour revue et validation. La migration AAL2 existante reste également en attente. Aucun changement Supabase ou Render n'est appliqué par cette branche.
