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

## Tranche Android locale — implémentée dans la branche de fonctionnalité
- L'application Super Admin Capacitor embarque maintenant son propre écran local ; elle n'attend plus le chargement initial de Render pour s'ouvrir.
- Un coffre local distinct de Supabase permet de créer/déverrouiller/verrouiller un espace de brouillons sur chaque installation.
- Les brouillons sont chiffrés côté appareil avec Web Crypto (AES-256-GCM, clé dérivée PBKDF2-SHA-256) et conservés dans IndexedDB sous forme chiffrée. Verrouillage automatique après 10 minutes.
- L'écran affiche l'état réseau et ouvre le vrai portail Super Admin en ligne lorsque la connexion est disponible.
- Cette tranche ne synchronise pas les brouillons, n'enregistre pas encore les appareils dans Supabase et ne donne aucun pouvoir serveur hors ligne. Le coffre local n'est pas le compte Super Admin.

## Limites et sécurité
- Ne stocker dans le coffre local que des brouillons non sensibles : jamais de données personnelles, KYC, commandes, paiements, retraits, identifiants, mots de passe ou jetons.
- Les paiements, retraits, KYC, rôles et actions irréversibles restent en ligne, après authentification et validation serveur.
- La synchronisation chiffrée/idempotente, l'enrôlement individuel des appareils, la révocation et les conflits restent à construire et tester avant de qualifier l'ensemble de « local-first synchronisé ».
- Les brouillons ne sont pas sauvegardés ailleurs : la perte des données de l'application ou de la phrase secrète locale peut les rendre irrécupérables.

## Migrations — non appliquées
`supabase/pending_migrations/20261103150000_super_admin_local_first.sql` crée les tables privées `super_admin_identities` et `super_admin_devices`. Elle reste dans `pending_migrations` pour revue et validation. La migration AAL2 existante reste également en attente. Aucun changement Supabase ou Render n'est appliqué par cette branche.
