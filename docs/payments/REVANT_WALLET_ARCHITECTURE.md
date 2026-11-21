# Revant Wallet — architecture et état d'intégration

## Décision produit
- Le libellé de navigation est « Wallet ».
- Une seule entrée Wallet dans la barre mobile, visible aux acheteurs et vendeurs connectés.
- Les comptes ayant une boutique disposent de deux vues dans le même espace : Acheteur et Vendeur.
- Vue par défaut : Vendeur lorsqu'une boutique existe, Acheteur sinon.
- Wallet acheteur : uniquement des moyens de paiement enregistrés. Aucun solde monétaire, dépôt ou transfert.
- Wallet vendeur : solde disponible, en attente et bloqué, historique, reçus et statistiques.
- Les deux vues partagent les mêmes composants, proportions, arrondis, typographies et langage visuel.

## Cartes acheteur — exigences
- Afficher la marque réellement fournie par le prestataire et, si disponible et autorisée, l'illustration officielle de l'émetteur ou du prestataire.
- Ne jamais déduire ou inventer l'identité graphique de la banque à partir d'un numéro de carte.
- À défaut d'illustration officielle, afficher une carte réseau élégante sans prétendre reproduire le design bancaire original.
- Stocker uniquement le jeton du prestataire et les métadonnées non sensibles : marque, quatre derniers chiffres, mois/année d'expiration et libellé éventuel.
- Ne jamais stocker CVV/CVC, PIN, piste magnétique ou numéro complet dans Revant.
- Ajout, suppression et choix par défaut confirmés par le prestataire et protégés par l'authentification.

## Vendeur — exigences financières
- Les montants proviennent du ledger serveur append-only, jamais d'un état calculé côté client.
- Séparer disponible, en attente et bloqué.
- Historique et reçus liés à des transactions réelles, avec contrôles d'accès par propriétaire de boutique.
- Statistiques calculées depuis les ventes et paiements confirmés puis rapprochées du ledger.
- Retraits désactivés tant que KYC, credentials du prestataire, réserve et contrôles ne sont pas validés.

## État vérifié au 21 novembre 2026
- BottomNav contenait cinq entrées ; l'entrée Wallet n'existait pas.
- Aucune route /wallet n'existait.
- src/server/ledger/README.md précise que le ledger financier n'est pas implémenté.
- Aucun module de portefeuille acheteur ou de cartes enregistrées n'a été trouvé dans le dépôt.
- La documentation iMoney décrit l'acceptation de Visa, Mastercard et GIM UEMOA au Niger, mais aucune fonction de tokenisation réutilisable n'a été vérifiée.
- Les écrans peuvent être préparés, mais l'ajout réel de cartes et les soldes vendeurs ne doivent pas être simulés.

## Blocages externes
1. Confirmer auprès d'iMoney ou d'un acquéreur partenaire l'existence d'un vault / jeton carte réutilisable, du consentement card-on-file et de l'API de gestion des cartes.
2. Obtenir les identifiants marchands et la documentation contractuelle de production.
3. Implémenter le ledger, les écritures de réserve, les webhooks idempotents, les remboursements et les règles de libération.
4. Tester les cartes et paiements en sandbox avant activation réelle.

## État de cette livraison
La navigation et les écrans de présentation sont préparés. Les CTA d'ajout de carte, les soldes et les statistiques financières restent non opérationnels tant que les fondations externes et comptables ne sont pas disponibles. Aucun déploiement Render n'est déclenché.