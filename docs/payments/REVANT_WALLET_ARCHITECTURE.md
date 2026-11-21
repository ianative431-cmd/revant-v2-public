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

## Où les fonds sont conservés — modèle cible
- Les fonds réels ne sont pas conservés dans Supabase, dans le compte technique de Revant ni dans le Wallet acheteur.
- Le paiement est traité par un prestataire/acquéreur autorisé. Les fonds suivent le circuit de règlement prévu par son agrément, son contrat marchand et ses banques partenaires.
- Revant conserve uniquement un registre comptable interne append-only : montant brut, frais, commission Revant, part due au vendeur, réserve, remboursements, litiges, reversements et références de transaction du prestataire.
- Le solde affiché au vendeur est un état comptable de sommes dues, rapproché des fonds réellement réglés. Il ne constitue pas en soi un dépôt, un compte de paiement ou de la monnaie électronique émise par Revant.
- Le modèle préféré est un règlement direct/contrôlé par le prestataire vers les comptes bancaires ou mobiles des vendeurs, avec la commission Revant prélevée selon un mécanisme contractuel validé. Si le prestataire ne permet pas ce partage, ne pas collecter puis redistribuer les fonds depuis un compte Revant sans validation juridique et réglementaire préalable.
- Ne jamais activer des retraits, des transferts internes ou un solde rechargeable avant validation du partenaire réglementé, des contrats, du KYC, des réserves et des procédures de rapprochement.

## Recherche réglementaire et prestataire — 21 novembre 2026
- La liste officielle BCEAO des établissements de paiement agréés dans l'UMOA au 28 février 2026 identifie iFUTUR comme l'unique établissement de paiement listé au Niger à cette date : iFUTUR, numéro EP.NG.001/2025, agrément du 06/05/2025.
- Les conditions publiques d'iMoney Encaissement indiquent l'acceptation des paiements Mobile Money, Visa, Mastercard et GIM UEMOA. Elles annoncent un reversement au marchand des montants nets dans un délai maximal de cinq jours ouvrés après la clôture de la période de facturation, vers le compte bancaire ou mobile renseigné par le marchand.
- Cette documentation publique établit qu'une offre d'encaissement marchand existe. Les pages officielles développeurs iFUTUR annoncent aussi des versements programmatiques et des remboursements par API, tandis que iMoney Cash Transfert annonce des paiements de masse via API. **Revant n'a pas de contrat ni de partenariat officiel confirmé avec iFUTUR/iMoney.** Ces annonces ne prouvent pas qu'iFUTUR accepte un modèle marketplace avec sous-marchands, split de paiement, conservation temporaire des fonds pour des vendeurs tiers ou reversements automatiques à chaque vendeur. Les endpoints, règles d'éligibilité, KYC des bénéficiaires et conditions contractuelles restent à obtenir. iMoney demeure un prestataire candidat à évaluer, sans sélection définitive.
- Avant toute activation, obtenir une confirmation écrite d'iFUTUR sur : marketplace/sous-marchands, identité du bénéficiaire contractuel des fonds, compte de règlement, split des commissions, reversements vendeurs, délais et réserves, remboursements/chargebacks, KYC des vendeurs, webhooks et tokenisation carte réutilisable.
- Si le mécanisme de paiement fractionné ou de reversement multi-vendeurs n'est pas autorisé par le contrat et le cadre réglementaire, chaque vendeur devra être enrôlé selon le modèle approuvé par le prestataire ou Revant devra utiliser un partenaire autorisé proposant explicitement cette fonctionnalité.

## État vérifié au 21 novembre 2026
- BottomNav contenait cinq entrées ; l'entrée Wallet n'existait pas.
- Aucune route /wallet n'existait.
- src/server/ledger/README.md précise que le ledger financier n'est pas implémenté.
- Aucun module de portefeuille acheteur ou de cartes enregistrées n'a été trouvé dans le dépôt.
- La documentation publique iMoney décrit l'acceptation de Visa, Mastercard et GIM UEMOA au Niger, mais aucune fonction de tokenisation réutilisable n'a été vérifiée.
- Les écrans peuvent être préparés, mais l'ajout réel de cartes et les soldes vendeurs ne doivent pas être simulés.

## Blocages externes et prochaines étapes
1. Obtenir d'iFUTUR une réponse écrite sur le modèle marketplace, sous-marchands, split et reversements multi-vendeurs.
2. Confirmer auprès d'iMoney ou d'un acquéreur partenaire l'existence d'un vault / jeton carte réutilisable, du consentement card-on-file et de l'API de gestion des cartes.
3. Obtenir les identifiants marchands et la documentation contractuelle de production.
4. Implémenter le ledger, les écritures de réserve, les webhooks idempotents, les remboursements et les règles de libération.
5. Tester les cartes et paiements en sandbox avant activation réelle.

## État de cette livraison
La navigation et les écrans de présentation sont préparés. Les CTA d'ajout de carte, les soldes et les statistiques financières restent non opérationnels tant que les fondations externes et comptables ne sont pas disponibles. Aucun déploiement Render n'est déclenché.
