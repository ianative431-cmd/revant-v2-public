# Revant — audit technique de suivi
Date: 2026-11-02
Base: main @ 5f409b9b07c2bdc61dc8877a0b60f62ff61359df
Branche: audit/finance-and-subscriptions-followup

## État Git
- Branche de travail créée avec le compte GitHub connecté; permission effective admin vérifiée.
- Le présent document a été écrit puis relu depuis GitHub.
- Aucun changement sur main.
- Aucun déploiement déclenché.

## Constats confirmés

### Finance — règlement vendeur
- Le trigger AFTER UPDATE sur orders appelle private.trigger_release_order_finance() lorsque le statut passe à delivered.
- Cette fonction appelle private.try_release_order_finance(), qui appelle private.release_order_finance().
- Malgré son nom, release_order_finance() ne transfère PAS pending_balance vers available_balance. Elle vérifie la commande delivered et un paiement paid, calcule la commission configurée (0,5 % actuellement), puis inscrit une entrée ledger de type sale et crédite le montant net dans pending_balance.
- La référence SALE-<order>-<shop> rend cette écriture idempotente via ON CONFLICT (reference) DO NOTHING.
- L'enum ledger_entry_type contient release, mais aucune fonction trouvée n'effectue le transfert pending -> available.
- Les seules fonctions trouvées qui modifient available_balance sont le débit lors d'une demande de retrait et la restitution après rejet d'un retrait. Aucune ne consomme pending_balance.
- Le ledger est protégé contre UPDATE/DELETE par prevent_ledger_mutation(); toute correction doit ajouter des écritures compensatoires, jamais modifier l'historique.
- La fonction request_payout vérifie le propriétaire du wallet, son statut, les règles de retrait, le solde disponible et le KYC si requis. Le montant est réservé/débité du disponible au moment de la demande; un rejet le restitue et ajoute une entrée ledger.
- system_settings confirme revant.commission_percent = 0.5 et revant.payments_enabled = false.
- Le projet avait prévu les notions « Fonds dus aux vendeurs », « Versements en transit » et « Réserves pour remboursements et litiges », mais aucune règle de délai ou de levée de réserve n'a été fixée.
- Décision bloquante avant code de règlement: définir le délai de disponibilité après livraison confirmée, la gestion d'une contestation ouverte, le montant mis en réserve, et les cas de remboursement partiel/total. Ne pas inventer cette politique.

### Abonnements boutiques
- La table store_subscriptions existe et utilise les états active, past_due, cancelled et expired.
- Aucun abonnement n'est actuellement enregistré.
- Aucun déclencheur ni fonction dédiée au renouvellement/expiration n'a été identifié.
- Le prix cible précédemment défini est 5 000 XOF/mois; le paiement et la suspension à échéance doivent être définis et testés avant activation.

### Boutique et catalogue
- Le bucket shop-media et ses règles d'accès existent.
- Les écrans vendeur de personnalisation (logo/bannière) et de création produit sont présents.
- Les politiques RLS lient les modifications au propriétaire.
- Les triggers empêchent le vendeur de s'attribuer les statuts actif, Pro ou Premium, et empêchent la publication d'un produit lorsque la boutique n'est pas active.

## Travaux à poursuivre
1. Obtenir la règle de disponibilité des fonds vendeurs, puis concevoir et tester le transfert pending -> available, les réserves et les écritures de compensation.
2. Écrire des tests SQL couvrant double exécution, remboursements, litiges, annulation et disponibilité des fonds.
3. Concevoir le cycle complet d'abonnement (création, paiement, renouvellement, échéance, annulation, suspension et réactivation).
4. Auditer les parcours commande/livraison et les rubriques admin encore en attente.
5. Synchroniser les migrations appliquées à distance avec les fichiers du dépôt.

## Garde-fous
- Pas de paiement réel, retrait réel ou ouverture publique avant validation.
- Pas de changement financier directement sur la base active sans migration testée et plan de retour arrière.
- Pas de déploiement automatique; Render reste le fournisseur cible.

## Contrôle complémentaire — espace associé et modération (02/11/2026)

### Rôle associé
- Le type public.user_role inclut désormais `associate`.
- Le rôle ne reçoit que `shops.view` et `products.view`; aucun droit users, commandes, finance, retraits, KYC, support, paramètres ou sécurité.
- L'attribution/révocation est réservée à un utilisateur ayant le rôle `super_admin`, par RPC dédiée; les changements sont consignés dans `admin_actions` et `audit_logs`.
- Le menu associé n'affiche que le tableau de bord, boutiques et produits. Le tableau de bord associé n'affiche que les nombres de boutiques et produits.
- Les pages boutiques et produits vérifient respectivement `shops.view` et `products.view` côté serveur; les autres pages admin vérifient leur permission dédiée ou `super_admin`. Le masquage du menu n'est donc pas la seule protection.
- `has_any_admin_role()` conserve volontairement sa liste de rôles historiques et n'inclut pas `associate`, pour ne pas accorder au rôle limité les droits RLS généraux de l'administration.
- Les RPC publiques d'attribution du rôle et de modération d'avis sont des wrappers SECURITY DEFINER avec search_path vide; les fonctions privées restent non exécutables directement par authenticated.

### Calendrier social
- La page calendrier vendeur est ajoutée dans Ma boutique; accès aux posts filtré par shop_id et owner_id avec RLS.
- Création et annulation de posts planifiés, fuseau Africa/Niamey et partage manuel natif/copie.
- Aucune publication automatique n'est activée; aucun token Meta/TikTok/Snapchat n'est simulé.
- La migration `secure_social_publishing_calendar` est un fichier source restauré; la table existe déjà sur Supabase. Ne pas la réappliquer sur le projet actif.

### Synchronisation migrations et CI
- Les migrations d'index FK et de suppression d'index dupliqué doivent encore être ajoutées au dépôt avec leur SQL exact; leur exécution distante a déjà été faite.
- Les migrations rôle associé et correction SECURITY DEFINER doivent être suivies dans le dépôt.
- GitHub Actions run 41482339263, commit 7124c699a633e47a5995fda82c7ee2bd6461df10: lint et build réussis.
- Aucun merge; aucun déploiement Render de la branche de travail.
