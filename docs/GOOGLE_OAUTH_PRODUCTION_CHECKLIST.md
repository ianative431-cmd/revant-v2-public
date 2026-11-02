# Vérification Google OAuth en production — Revant

Ce document sert à diagnostiquer la connexion Google sans exposer de secret. Les URL ci-dessous correspondent au service Render actuellement configuré et au projet Supabase Revant vérifié le 2 novembre 2026.

## 1. Google Cloud Console

Dans **APIs & Services → Credentials → OAuth 2.0 Client ID** utilisé par Supabase, vérifier que l'URI de redirection autorisée est exactement :

`https://xugcmpnrigqfszyfufoc.supabase.co/auth/v1/callback`

Cette URL est le callback du fournisseur Supabase. Ce n'est pas le callback de l'application Revant.

Vérifier aussi que le client ID et le secret OAuth configurés dans Supabase proviennent de cette même application Google et que l'écran de consentement OAuth est publié/configuré pour les comptes attendus.

## 2. Supabase Auth

Dans **Authentication → URL Configuration** :

- Site URL : `https://revant-v2-ui-premium.onrender.com`
- Redirect URL autorisée : `https://revant-v2-ui-premium.onrender.com/auth/callback*` (le `*` couvre le paramètre `next` ajouté par le bouton Google).
- Ajouter séparément les URL localhost uniquement pour le développement si nécessaire.

Dans **Authentication → Providers → Google** :

- Google doit être activé.
- Le Client ID et le Client Secret doivent correspondre au client OAuth Google de l'étape 1.

## 3. Render — service `revant-v2-ui-premium`

Vérifier les noms de variables suivants dans **Environment**. Les valeurs doivent toutes appartenir au même projet Supabase Revant :

| Variable | Valeur attendue |
|---|---|
| `NEXT_PUBLIC_SITE_URL` | `https://revant-v2-ui-premium.onrender.com` (sans slash final) |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xugcmpnrigqfszyfufoc.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | clé publique anon/publishable du projet Revant |
| `SUPABASE_SERVICE_ROLE_KEY` | clé privée service_role du même projet ; ne jamais l'exposer côté navigateur |

Ne jamais copier une clé privée dans GitHub, un ticket, un message ou une capture d'écran. Pour vérifier, comparer localement les valeurs et ne partager que le nom des variables présentes ou absentes.

Le service Render a été vérifié : branche `main`, auto-deploy désactivé. Après modification des variables, effectuer un déploiement manuel uniquement après revue.

## 4. Test et interprétation des journaux

Après déploiement contrôlé de la branche contenant le diagnostic du callback :

1. Ouvrir la connexion Revant et choisir Google.
2. Sélectionner le compte Google attendu.
3. Vérifier si le navigateur revient sur `/auth/callback`.
4. Dans les journaux Render, chercher les marqueurs `[auth-callback]`.

Interprétation :
- Aucun appel à `/auth/callback` : vérifier d'abord le fournisseur Google dans Supabase, l'URI Google autorisée et la Redirect URL Supabase.
- `authorization_code_missing` : le navigateur est revenu sans code OAuth.
- `supabase_client_init_failed` : vérifier les variables Supabase du service Render.
- `code_exchange_failed` : le code n'a pas pu être échangé ; vérifier l'URL du projet, les clés, l'expiration du code et la configuration OAuth.
- `admin_session_verification_failed` : la session n'a pas pu être relue.
- `super_admin_role_check_failed` : le compte connecté n'a pas le rôle super-admin attendu ou la lecture des rôles a échoué.

Le callback n'enregistre volontairement aucun e-mail, code OAuth, jeton, secret ou chaîne de requête.

## 5. État vérifié

Au 2 novembre 2026 :
- Le service Render cible utilise `main` et l'auto-deploy est désactivé.
- Les logs consultés ne contiennent aucun appel à `/auth/callback` dans la fenêtre d'analyse.
- Le callback avec journalisation sûre est présent dans la PR #21, mais n'est pas encore en production.
- Le diagnostic de la connexion Google n'est donc pas déclaré résolu.
