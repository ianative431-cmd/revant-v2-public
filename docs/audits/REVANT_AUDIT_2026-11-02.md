# Revant — audit technique de suivi
Date: 2026-11-02
Base: main @ 5f409b9b07c2bdc61dc8877a0b60f62ff61359df
Branche: audit/finance-and-subscriptions-followup

## État
- Branche de travail créée avec le compte GitHub connecté (permission effective admin vérifiée).
- Aucun changement sur main.
- Aucun déploiement déclenché.

## Constats confirmés
### Finance
- Les ventes créditent le solde vendeur en pending_balance.
- Les retraits utilisent available_balance.
- L'audit des fonctions et déclencheurs consultés n'a pas identifié de mécanisme de libération pending_balance -> available_balance.
- Ne pas ajouter un transfert sans définir le délai de disponibilité, le statut final de commande, la gestion des remboursements/litiges, l'idempotence et l'écriture append-only du ledger.

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
1. Inspecter le modèle complet des commandes, paiements, wallet et ledger pour définir un règlement vendeur sûr.
2. Écrire des tests SQL couvrant double exécution, remboursements, litiges, annulation et disponibilité des fonds.
3. Concevoir le cycle complet d'abonnement (création, paiement, renouvellement, échéance, annulation, suspension et réactivation).
4. Auditer les parcours commande/livraison et les rubriques admin encore en attente.
5. Synchroniser les migrations appliquées à distance avec les fichiers du dépôt.

## Garde-fous
- Pas de paiement réel, retrait réel ou ouverture publique avant validation.
- Pas de changement financier directement sur la base active sans migration testée et plan de retour arrière.
- Pas de déploiement automatique; Render reste le fournisseur cible.
