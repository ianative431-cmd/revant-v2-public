# Conception — panier multi-articles et commandes multi-boutiques

**Statut : conception technique vérifiée, implémentation non commencée.**  
Cette note décrit le changement nécessaire à partir du code existant. Elle ne constitue pas une migration appliquée et ne doit pas être interprétée comme une fonctionnalité déjà disponible.

## 1. État actuel observé

- Le navigateur stocke `revant-cart` dans `localStorage`.
- Un article de panier contient actuellement `id`, `name`, `price`, `currency` et `image`. Il n'y a pas de quantité.
- `AddToCartButton` remplace l'article existant quand le même produit est ajouté une seconde fois.
- `CartPage` propose une commande individuelle pour chaque article.
- `/commande/visiteur` accepte un seul `productId`.
- `create_guest_order` crée une commande et une ligne `order_items` pour un seul produit.
- `seller_confirm_order` et `seller_cancel_order` exigent qu'une commande ne concerne qu'une seule boutique. Ils savent déjà traiter plusieurs lignes d'articles d'une même boutique.
- Le suivi invité actuel repose sur un jeton HMAC, un hash stocké en base et un cookie HttpOnly par commande.

## 2. Comportement cible

- Le client peut ajouter plusieurs produits et modifier la quantité de chacun.
- Le client remplit une seule fois ses coordonnées de livraison.
- Le système crée **une commande par boutique et par devise**, avec plusieurs lignes d'articles dans chaque commande.
- Chaque boutique conserve son propre cycle vendeur, sa livraison, son suivi et ses éventuels litiges.
- Si plusieurs devises sont présentes, les totaux restent séparés ; ne jamais additionner des montants de devises différentes.
- Le panier est vidé uniquement après confirmation que le lot complet a été créé.
- Le parcours actuel de commande individuelle reste compatible.

## 3. Contrat de sécurité et de cohérence

1. Le navigateur n'envoie que les identifiants produits et les quantités. Les noms, prix, devise, boutique, stock et frais affichés côté client ne sont jamais des données de confiance.
2. Le serveur valide le format des identifiants, les quantités, le nombre maximal d'articles, les coordonnées et le honeypot.
3. La fonction SQL relit les produits et boutiques depuis la base, refuse les annonces inactives, les boutiques inactives, les stocks insuffisants et l'achat de ses propres produits.
4. Tous les produits du lot sont verrouillés dans un ordre déterministe par identifiant afin de réduire les interblocages.
5. La création de tout le lot est faite dans **une seule transaction PostgreSQL** : si une boutique ou un produit échoue, aucune commande du lot ne reste créée.
6. Le stock n'est pas déduit au moment de la demande ; il est réservé au moment où chaque vendeur confirme sa commande, selon le mécanisme existant.
7. L'idempotence est portée par un identifiant de lot unique et une empreinte de requête calculée côté serveur. Une nouvelle soumission identique restitue les commandes déjà créées ; une réutilisation de la même clé avec un contenu différent est refusée.
8. Le suivi utilise un jeton HMAC lié à la clé du lot. Le jeton brut n'est jamais stocké en base ; un seul cookie HttpOnly, Secure en production et SameSite=Lax protège la page de confirmation du lot.
9. Le RPC de création et celui de lecture du lot restent réservés au rôle `service_role`. Aucun droit direct n'est accordé à `anon` ou `authenticated`.
10. La limitation par téléphone compte les lots de commande, pas le nombre de boutiques dans un lot ; un achat auprès de plusieurs boutiques ne doit pas être pénalisé comme plusieurs soumissions distinctes.

## 4. Évolution SQL proposée

Créer `public.guest_checkout_batches` avec au minimum :
- `id uuid primary key` (clé d'idempotence du lot) ;
- `request_hash text not null` (empreinte SHA-256 calculée côté serveur) ;
- `tracking_token_hash text not null` ;
- `buyer_id uuid null` ;
- `guest_phone_hash text not null` ;
- `created_at timestamptz not null default now()`.

Ajouter `guest_checkout_batch_id uuid` à `public.orders`, avec une clé étrangère vers le lot et un index. Garder `orders.idempotency_key` pour les commandes individuelles déjà existantes ; les nouvelles commandes de lot reçoivent chacune une clé propre.

Créer un RPC privé `private.create_guest_checkout_batch_impl(...)` et son wrapper public `public.create_guest_checkout_batch(...)` :
- entrée : JSON limité à une liste d'identifiants produit et de quantités, coordonnées invité, clé du lot, hash du jeton, empreinte de requête, identifiant acheteur éventuel ;
- verrouillage d'idempotence du lot ;
- vérification d'un lot existant et restitution de ses commandes si la requête correspond exactement ;
- verrouillage puis validation de tous les produits ;
- regroupement des lignes par boutique et devise ;
- insertion d'une commande, de ses lignes et d'une livraison par groupe ;
- retour du lot et de la liste des numéros de commande ;
- privilèges d'exécution strictement limités à `service_role`.

Créer `private.get_guest_checkout_batch_impl(batch_id, token_hash)` et son wrapper service-role-only pour retourner le lot et ses commandes avec leurs lignes agrégées. Ne pas exposer un RPC de suivi public.

La migration devra également conserver les fonctions de transition vendeur et vérifier qu'une commande ne contient jamais plusieurs boutiques. Le flux multi-boutiques ne doit jamais créer une commande unique partagée entre plusieurs vendeurs.

## 5. Évolution de l'interface

1. Étendre le type du panier avec `quantity` ; l'ajout répété augmente la quantité au lieu de remplacer l'article.
2. Ajouter les contrôles + / −, suppression et sous-total par devise dans `CartPage`.
3. Ajouter une page serveur de paiement groupé qui reçoit uniquement les identifiants et quantités, puis relit les informations réelles dans Supabase pour afficher les produits.
4. Le formulaire de livraison est unique pour le client ; il transmet une clé d'idempotence générée côté serveur.
5. L'action serveur calcule l'empreinte de la requête, le jeton HMAC et appelle uniquement le RPC privilégié.
6. Après succès du lot, créer un cookie HttpOnly de suivi et rediriger vers une confirmation de lot listant chaque commande, chaque boutique et ses lignes.
7. Vider le panier côté client seulement après confirmation de création du lot.

## 6. Tests obligatoires avant toute application de migration

- Lot avec plusieurs produits d'une même boutique : une commande, plusieurs lignes.
- Lot avec plusieurs boutiques : une commande et une livraison par boutique.
- Lot avec plusieurs devises : totaux distincts.
- Produit supprimé, inactif ou stock insuffisant : rollback complet du lot.
- Boutique inactive ou achat de son propre produit : rollback complet.
- Deux soumissions simultanées avec la même clé : un seul lot.
- Même clé réutilisée avec un contenu différent : refus.
- Appel RPC direct par `anon` ou `authenticated` : refus.
- Lecture du suivi sans cookie ou avec un jeton incorrect : refus.
- Confirmation et annulation vendeur : stock déduit/restauré correctement pour toutes les lignes.
- Rate limit : une soumission multi-boutiques compte comme un lot.
- Test E2E avec produits et boutiques de test isolés de la production.

## 7. Ordre de réalisation

1. Ajouter et tester les fonctions SQL dans une branche et un environnement de test isolé.
2. Ajouter les types et l'action serveur.
3. Construire l'interface du panier et le formulaire groupé.
4. Construire la confirmation et le suivi du lot.
5. Ajouter tests unitaires, tests SQL et E2E.
6. Faire une revue de sécurité et de compatibilité avec l'ancien checkout.
7. Seulement après accord explicite : appliquer la migration au projet Supabase, puis envisager le déploiement Render.

**Blocage actuel :** le projet Supabase connecté est la base de production ; aucun environnement de staging isolé n'a été confirmé. La migration de lot ne doit donc pas être appliquée à la production tant que son test transactionnel et ses scénarios de rollback n'ont pas été validés ailleurs.
