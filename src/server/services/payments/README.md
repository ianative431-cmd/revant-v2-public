# Paiements — NON IMPLÉMENTÉ

Ce dossier est réservé au module de paiement (encaissement acheteur).

Ne pas implémenter avant :
1. Confirmation du prestataire retenu (Flutterwave, PayDunya, CinetPay ou
   autre) après vérification réelle de sa couverture du Niger.
2. Validation explicite de Mourad pour démarrer cette étape.

Exigences déjà actées pour quand ce module sera construit (voir
SECURITY.md et revant_etat_reel_et_plan.md) : idempotence stricte,
vérification de signature de webhook, validation serveur des montants,
aucune donnée de carte stockée par Revant.
