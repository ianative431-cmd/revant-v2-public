# Revue passerelle de paiement Niger — iMoney Encaissement

Date de vérification : 21 novembre 2026  
Dépôt : `ianative431-cmd/revant-v2-public`  
Statut : étude technique et commerciale, aucune activation de paiement.

## Statut et décision de présélection

**iMoney Encaissement (iFUTUR SA) est un prestataire candidat à évaluer, et non un partenaire officiel de Revant.**

Au 21 novembre 2026, aucun contrat signé, compte marchand Revant validé, mandat d'encaissement, accord de reversement ou partenariat officiel avec iFUTUR/iMoney n'a été établi dans les éléments vérifiés. Aucune intégration ne doit être présentée comme autorisée ou active. La couverture technique décrite ci-dessous justifie uniquement de poursuivre la vérification commerciale, juridique et technique.

Le service est local au Niger et sa documentation officielle décrit les moyens suivants pour le marché nigérien :
- Mobile Money : Airtel Niger, Moov Niger, Zamani Niger.
- Canaux STA : Amana et Nita Online.
- Cartes : Visa, Mastercard et GIM UEMOA.
- Autres moyens listés : BOA Niger.

Le site officiel annonce l'encaissement par API, liens de paiement hébergés et SDK JavaScript. L'API documentée permet donc de couvrir les paiements mobiles directs et de déléguer les autres canaux à une page hébergée.

Sources officielles :
- https://api.i-pay.money/
- https://docs.i-pay.money/llms.txt
- https://docs.i-pay.money/demarrer/mise-en-route
- https://docs.i-pay.money/guides/reversement
- https://i-pay.money/terms?locale=fr

## Intégration API confirmée

### Authentification et environnements
- Base URL : `https://i-pay.money/api/v1`.
- API REST JSON.
- En-têtes communs : `Authorization: Bearer <secret>`, `Content-Type: application/json`, `Ipay-Target-Environment: sandbox|live`.
- `POST /payments` exige `Ipay-Payment-Type: mobile`.
- `POST /external_payments` exige `Ipay-Payment-Type: external_payment`.
- Clés Sandbox et Live distinctes ; une clé d'un environnement ne fonctionne pas dans l'autre.
- Les clés secrètes restent exclusivement côté serveur, jamais dans le navigateur, l'application Android ou GitHub.

### Paiement mobile direct
`POST /payments` accepte un montant entier XOF, le pays `NE`, la devise `XOF`, le MSISDN, un `transaction_id` unique et le nom du client.
- Minimum Live documenté : 25 XOF.
- Minimum Sandbox documenté : 50 XOF.
- La réponse de création n'est pas une preuve de paiement.
- Le statut définitif doit être vérifié via `GET /payments/{reference}` ou par webhook, puis confirmé côté serveur avant toute livraison.
- La documentation précise que `transaction_id` doit être unique. La détection des doublons est applicative et n'est pas garantie sous appels concurrents ; il n'existe pas d'en-tête d'idempotence. Après un timeout, consulter le statut avant toute nouvelle tentative.

### Page de paiement hébergée
`POST /external_payments` retourne `page_url`, à transmettre au client.
- Le client choisit le canal disponible sur la page iMoney.
- Les deux URL de redirection doivent être HTTPS.
- Les liens API expirent après 30 minutes.
- La référence peut être générée par iMoney ; si Revant la fournit, elle doit être aléatoire, privée et comporter au moins 128 bits d'entropie.
- `GET /external_payments/{reference}` est public, sans clé. La référence doit donc être traitée comme un secret et ne jamais être séquentielle ou publiée dans les journaux.
- La redirection navigateur n'est jamais une preuve de paiement ; la vérification serveur reste obligatoire.

### Webhooks
- L'en-tête de contrôle est `Secret-Hash`.
- Ce champ est un secret partagé statique configuré dans le tableau de bord iMoney ; ce n'est pas une signature HMAC calculée sur le corps.
- Événements : `payment_created`, `payment_pending`, `payment_succeeded`, `payment_failed`, `payment_refunded`.
- Payload contient notamment `external_reference`, `reference`, `status`, `amount`, `net_amount`, `payment_method`, `validated_at`.
- Le traitement doit être idempotent par référence iMoney.
- Les notifications peuvent ne pas être dans l'ordre attendu.
- iMoney n'effectue pas de relances illimitées : une tentative initiale puis un rattrapage seulement si aucune tentative n'a été enregistrée. Une tentative échouée n'est pas rejouée. Il faut donc une réconciliation périodique par consultation API des paiements en attente.

## Tests Sandbox documentés

Pour le flux mobile Niger, les numéros de test documentés sont :
- `40410000000`, `40410000001` : succès.
- `40410000002`, `40410000003` : échec.
- `40410000004`, `40410000005` : fonds insuffisants.
- `40410000006`, `40410000007` : refus.
- `40410000008`, `40410000009` : attente, puis succès automatique après environ 90 secondes.

Les tests doivent couvrir succès, échec, montant invalide, référence dupliquée, référence inconnue, webhook manquant/échoué, webhook doublé et paiement toujours pending. Les doublons Sandbox n'ont pas nécessairement la même réponse HTTP que Live : ne pas figer une assertion non garantie.

## Comparaison des options

| Prestataire | Couverture Niger/XOF documentée | Conclusion |
| --- | --- | --- |
| iMoney Encaissement / iFUTUR | Airtel, Moov, Zamani, Amana, Nita, Visa/Mastercard/GIM UEMOA ; API et hosted checkout | Couverture locale publiée intéressante ; candidat à qualifier, sans contrat ni sélection définitive |
| Moneroo | Airtel Niger XOF listé pour encaissement ; la carte XOF listée ne couvre pas NE ; la liste des reversements ne liste pas de méthode Niger | Alternative possible pour Airtel Niger, mais couverture carte et reversements Niger insuffisamment adaptée |
| Flutterwave | XOF et cartes présents, mais les réseaux Mobile Money francophones listés officiellement couvrent BF, CM, CI et SN, pas NE | Ne pas retenir comme voie principale pour Mobile Money au Niger sans confirmation écrite d'éligibilité du compte et des réseaux |

Sources comparatives :
- https://docs.moneroo.io/fr/payments/methodes-disponibles
- https://docs.moneroo.io/payouts/available-methods
- https://developer.flutterwave.com/docs/collections-inflow/payment-methods
- https://developer.flutterwave.com/docs/coverage
- https://developer.flutterwave.com/docs/collections-inflow/mobile-money

## Reversements et frais : limites à ne pas confondre

La documentation iMoney décrit les reversements dans le tableau de bord marchand, pas une API publique de création de reversement dans le contrat API v1 consulté.
- Les transactions réussies doivent avoir plus de trois jours pour être éligibles à une demande de reversement.
- Modes indiqués : My NITA (1 %), Amana (1 %), virement bancaire (0 % dans la configuration décrite), compte PayOUT (0 % dans la configuration décrite).
- Les frais effectifs dépendent du contrat marchand et des moyens activés.
- Les conditions marchandes iMoney mentionnent un reversement au marchand sous cinq jours ouvrés maximum après clôture de la période de facturation, sous réserve des conditions contractuelles.

**Conséquence pour Revant :** si un contrat est conclu ultérieurement, iMoney pourrait servir de passerelle d'encaissement. À ce jour, aucun partenariat n'est confirmé. Le prestataire ne remplace pas le ledger interne Revant ni le système de règlement des vendeurs. La commission, le solde pending, le solde available, les remboursements, les litiges et les paiements aux vendeurs doivent rester pilotés par un ledger Revant auditable et par un contrat de reversement explicitement convenu.

## État réel de Revant au moment du contrôle

Lecture Supabase en lecture seule :
- `payment_providers` : `flutterwave`, `ipay`, `moneroo` sont tous désactivés.
- `payments` : 0 enregistrement.
- `wallets` : 0 enregistrement.
- `ledger_entries` : 0 enregistrement.
- `store_subscriptions` : 0 enregistrement.
- Aucun code d'intégration serveur de paiement, de webhook de paiement ou de réconciliation n'a été trouvé dans `src` au moment du scan.
- Les pages vendeur/admin d'abonnement sont consultatives ; le tarif cible 5 000 XOF/mois est affiché, mais paiement et renouvellement automatique ne sont pas opérationnels.

## Blocages réels avant activation

1. Ouvrir/valider un compte marchand iMoney Encaissement au nom de l'entité qui exploitera Revant. L'accès Live exige une validation documentaire iMoney ; cela ne peut pas être remplacé par une clé inventée.
2. Obtenir les clés API Sandbox et Live dans le tableau de bord du compte marchand, et configurer le Secret-Hash du webhook. Ne jamais les envoyer dans le dépôt Git.
3. Faire confirmer par iFUTUR les conditions commerciales, les frais exacts par opérateur, les reversements, la possibilité d'encaisser pour une marketplace et les règles de partage de fonds/sous-marchands.
4. Réconcilier l'historique des migrations Supabase : 29 sources historiques distantes manquent toujours dans le dépôt selon l'audit de migration. Ne pas exécuter `supabase db push` ni rejouer les archives avant rapprochement.
5. Définir et valider le flux de fonds marketplace avant d'activer l'encaissement : Revant collecte-t-il en tant que marchand principal, comment les vendeurs sont-ils payés, qui porte les remboursements et chargebacks, comment les fonds sont-ils bloqués en cas de litige ?

## Sécurité non négociable pour l'implémentation
- Aucun paiement ne devient `paid` sur la seule réponse de création ou la redirection navigateur.
- Vérifier le webhook `Secret-Hash` par comparaison en temps constant ; ne pas appliquer HMAC au mauvais format.
- Réconcilier périodiquement les paiements pending par consultation API.
- Unicité/idempotence internes côté Revant, verrouillage transactionnel avant appel fournisseur, et recherche du statut après timeout avant de retenter.
- Vérifier montant, devise, référence, commande et compte marchand côté serveur.
- Ne jamais enregistrer les secrets ou les numéros de carte dans les logs.
- Garder les trois fournisseurs désactivés tant que Sandbox, compte Live, flux de règlement, remboursements et contrôles de fraude ne sont pas validés.
- Ne pas créer de ledger ni de mouvement de solde avant d'avoir arrêté l'architecture du module Paiements et les règles de règlement ; le README financier du dépôt le demande explicitement.

## Prochaine étape technique autorisée
Préparer l'adaptateur iMoney en branche isolée et ses tests simulés, sans clé ni transaction réelle ; conserver le fournisseur désactivé. L'intégration ne pourra être testée en Sandbox qu'après création et validation du compte marchand et ajout sécurisé des clés d'environnement. La mise en production Live exige en plus la validation du dossier par iMoney et la validation du modèle de reversement marketplace.
