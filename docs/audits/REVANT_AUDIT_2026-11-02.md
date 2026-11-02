# Revant — audit technique de suivi
Date: 2026-11-02
Base: main @ 48b51fa13d405e46a757288217e02771d454846f
Branche de suivi: fix/associate-rpc-sync-20261102

## État Git
- Branche de travail créée avec le compte GitHub connecté; permission effective admin vérifiée.
- Le présent document a été écrit puis relu depuis GitHub.
- La PR #26 a été fusionnée dans main au commit `48b51fa13d405e46a757288217e02771d454846f`.
- Le commit `48b51fa13d405e46a757288217e02771d454846f` est déployé sur le service public Render; déploiement `dep-dbkbngmc6qcc73e49aag` terminé avec statut `live` le 2026-11-02 à 16:37 UTC. L'auto-déploiement reste désactivé.

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
5. Vérifier que toutes les migrations restaurées correspondent exactement à l'historique distant, puis maintenir le dépôt synchronisé.

## Garde-fous
- Pas de paiement réel, retrait réel ou ouverture publique avant validation.
- Pas de changement financier directement sur la base active sans migration testée et plan de retour arrière.
- Pas de déploiement automatique; Render reste le fournisseur cible.

## Contrôle complémentaire — rôle associé et sécurité RPC

- Le type `public.user_role` inclut `associate`.
- Le rôle associé reçoit exclusivement `shops.view` et `products.view`; aucun droit de consultation des utilisateurs, commandes, finances, retraits, KYC, support, paramètres ou journaux.
- L'attribution/révocation est réservée à `super_admin` par RPC et journalisée dans `admin_actions` et `audit_logs`.
- Le menu associé ne présente que le tableau de bord, boutiques et produits. Les pages boutiques et produits appliquent également `requirePermission` côté serveur.
- `has_any_admin_role()` n'inclut volontairement pas `associate`, afin de ne pas lui accorder les autorisations RLS générales de l'administration.
- Les fonctions privées de gestion du rôle et de modération d'avis ne sont pas exécutables par `authenticated` ni `anon`. Les wrappers publics sont `SECURITY DEFINER`, avec `search_path` vide, et gardent les contrôles métier.
- Le contrôle SQL de la base confirme l'exécution authentifiée des wrappers publics et le refus d'exécution directe des fonctions privées.

## Calendrier social vendeur

- Page de calendrier ajoutée à Ma boutique; les posts sont filtrés par boutique et propriétaire avec RLS.
- Planification, annulation, fuseau Africa/Niamey et partage manuel natif/copie sont présents.
- La publication automatique n'est pas connectée; aucune publication n'est prétendue comme effectuée.
- La migration `social_posts` était déjà appliquée dans Supabase; son fichier source a été restauré dans le dépôt. Ne pas la réappliquer sur le projet actif.

## Synchronisation et livraison

- Les migrations d'index FK et de suppression de l'index dupliqué ont été restaurées dans le dépôt par la PR #26.
- La PR #26 a été fusionnée dans `main` au commit `48b51fa13d405e46a757288217e02771d454846f`.
- La PR #28 de suivi a synchronisé les migrations de création du type `associate` et de correction des wrappers RPC.
- Le run GitHub Actions `41484027551` sur le commit `4e17d357` a terminé avec lint et build réussis; le commit suivant ne modifiait que ce rapport documentaire.
- La PR #28 a été fusionnée au commit `7f3fc44299bfcd6e5c08a62d566a101dddafb089`; le déploiement Render `dep-dbkbs94s728c73cndf5g` est terminé avec statut `live` le 2026-11-02 à 16:47 UTC.

## Contrôles après déploiement final — 02/11/2026

- Commit main déployé : `7f3fc44299bfcd6e5c08a62d566a101dddafb089`.
- Render : `dep-dbkbs94s728c73cndf5g`, statut `live`; le nouveau conteneur Next.js a démarré et a affiché `Ready`.
- Le build Render a compilé Next.js, terminé TypeScript et généré les 51 pages statiques.
- `npm install` a signalé 18 vulnérabilités dans l'arbre de dépendances : 16 modérées, 1 élevée et 1 critique. Aucun `npm audit fix --force` n'a été exécuté; il faut identifier les paquets précis et appliquer des mises à jour ciblées sur une branche séparée.
- L'advisor Supabase signale toujours la protection contre les mots de passe compromis désactivée; le connecteur utilisé ne permet pas de modifier ce paramètre Auth.
- L'advisor Supabase signale 12 fonctions SECURITY DEFINER accessibles aux comptes authentifiés. Les 10 fonctions métier préexistantes ont été auditées avec leurs contrôles d'identité/propriété; les 2 nouvelles RPC admin vérifient respectivement `super_admin` et `support.manage`. Le linter reste volontairement signalé car ces RPC doivent être appelables par les sessions authentifiées.
- `private.delivery_code_secrets` conserve RLS activé sans policy, intentionnellement.
- Aucun événement OAuth Google/callback n'a été enregistré dans les logs Supabase après le déploiement. La correction des variables Render est en place, mais la connexion Google ne peut pas être déclarée validée avant un essai réel avec un compte utilisateur.
