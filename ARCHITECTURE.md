# Architecture Revant

## Organisation du projet

```
src/
  app/                      Frontend (Next.js App Router) : pages et layouts
    admin/                  Pages du back-office (non implémenté)
  lib/
    supabase/
      client.ts             Client Supabase navigateur (clé publique uniquement)
      server.ts             Client Supabase serveur, respecte les droits de l'utilisateur courant (RLS)
      admin.ts              Client Supabase "service role" — contourne RLS, réservé à l'admin serveur, jamais importable côté navigateur
    env.ts                  Point d'accès unique et validé aux variables d'environnement
  server/
    auth/                   Helpers serveur d'authentification et de vérification de rôle
    db/                     Fonctions d'accès aux données, encapsulées par domaine
    services/
      payments/             Intégration prestataire de paiement (non implémenté)
      notifications/        E-mail / SMS / in-app (non implémenté)
    ledger/                 Comptabilité interne : wallets, écritures, payouts (non implémenté)
    admin/                  Logique serveur du back-office (non implémenté)
  middleware.ts             Rafraîchissement de session Supabase à chaque requête
  types/                    Types partagés, dont les types générés depuis le schéma Supabase (à générer plus tard)
```

## Communication frontend ↔ backend

Le frontend (composants React dans `app/`) ne parle jamais directement à la base de données. Deux chemins possibles :

1. **Server Components / Server Actions** : lisent/écrivent via `src/lib/supabase/server.ts`, qui applique automatiquement les règles RLS de l'utilisateur connecté.
2. **Route Handlers** (`app/api/.../route.ts`, à créer au fil des étapes) : pour les cas nécessitant un contrôle serveur explicite (ex. futur webhook de paiement), toujours avec validation stricte des entrées.

Le client `admin.ts` (clé service role) n'est utilisé que dans du code strictement serveur, pour des opérations qui doivent explicitement dépasser les droits normaux (ex. modération). Il ne sera branché qu'à l'étape Administration.

## Utilisation de Supabase

- **Auth** : gestion des comptes et des sessions (étape 2).
- **Postgres + RLS** : chaque table sensible aura des règles RLS restreignant l'accès aux seules données de l'utilisateur, sauf pour les données publiques (annonces actives).
- **Storage** : deux buckets prévus — un public pour les photos d'annonces, un privé (accès par URL signée uniquement) pour les documents KYC, quand ce module sera construit.

## Gestion des secrets

- Toute valeur sensible passe par une variable d'environnement, jamais écrite en dur.
- Les variables publiques (`NEXT_PUBLIC_...`) ne contiennent jamais de secret : seules `NEXT_PUBLIC_SUPABASE_URL` et `NEXT_PUBLIC_SUPABASE_ANON_KEY` (clé publique par conception) sont exposées.
- `SUPABASE_SERVICE_ROLE_KEY` reste strictement côté serveur.
- `.env*` est exclu de Git par défaut (voir `.gitignore`) ; seul `.env.example` (sans valeurs) est versionné.

## Règles de sécurité fondamentales

Voir `SECURITY.md` pour le détail complet. Rappel des principes structurants dès ce socle :
- Aucune décision de rôle ou de permission ne doit reposer sur autre chose qu'une vérification serveur.
- Le middleware ne fait que rafraîchir la session ; il ne prend aucune décision d'autorisation.
- Aucun module sensible (paiements, ledger, KYC, admin) n'est implémenté à ce stade — uniquement leur emplacement réservé.

## Stratégie dev / staging / production

- **Développement** : `.env.local`, projet Supabase de développement dédié, exécution locale (`npm run dev`).
- **Staging** : déploiement Vercel sur une branche dédiée, projet Supabase séparé (ou schéma séparé), variables d'environnement propres à cet environnement dans Vercel.
- **Production** : déploiement Vercel sur la branche principale, projet Supabase de production, variables d'environnement dédiées, mode debug désactivé.

Aucune valeur d'environnement n'est jamais partagée entre ces trois environnements.
