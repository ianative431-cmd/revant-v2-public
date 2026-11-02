# Audit de préparation financière Revant

Date : 2 novembre 2026
Projet Supabase : `xugcmpnrigqfszyfufoc`
Dépôt : `ianative431-cmd/revant-v2-public`

## État réel des données

Les tables financières existent, mais elles ne contiennent actuellement aucune transaction :
- `payments` : 0
- `ledger_entries` : 0
- `wallets` : 0
- `payouts` : 0

La table `payment_providers` contient trois fournisseurs, tous désactivés :
- Flutterwave — `enabled = false`, devise prise en charge : XOF
- iPay — `enabled = false`, devise prise en charge : XOF
- Moneroo — `enabled = false`, devise prise en charge : XOF

Une règle de retrait existe dans `withdrawal_rules`. Aucune règle de retrait n'a été modifiée pendant cet audit.

## Protections déjà présentes et vérifiées

La table `payments` possède :
- une contrainte unique sur `idempotency_key` ;
- une unicité partielle empêchant plusieurs paiements `pending` ou `authorized` pour une même commande ;
- une unicité sur le couple fournisseur / identifiant de paiement fournisseur.

La fonction `create_payment_intent` vérifie côté serveur :
- que l'utilisateur est connecté et propriétaire de la commande ;
- que la clé d'idempotence est valide ;
- que la commande est dans un état payable et que son montant est positif ;
- que le fournisseur est activé et accepte la devise de la commande.

Les droits d'écriture directe sur les tables financières sont réservés à `service_role`; les utilisateurs authentifiés disposent de la lecture soumise aux règles RLS. Le registre `ledger_entries` est conçu pour être immuable.

## Durcissement supplémentaire vérifié le 2 novembre

- La vue `public.admin_finance_summary` est une vue `security_invoker`, et non une table. Ses privilèges directs ont été retirés à `anon` et `authenticated`. Le RPC d'administration `admin_finance_snapshot` continue de l'utiliser sous son propriétaire.
- Les privilèges directs `INSERT`, `UPDATE` et `DELETE` du rôle `anon` ont été retirés des objets existants du schéma `public`.
- Vérification après migration : 0 privilège direct d'écriture anonyme sur les objets publics ; la lecture publique des boutiques et produits actifs reste autorisée.

Limite restante : Supabase a refusé la modification des privilèges par défaut des rôles créateurs `postgres` et `supabase_admin`. Les nouvelles tables créées dans `public` doivent donc continuer à intégrer explicitement RLS et la révocation des écritures `anon` jusqu'à ce qu'un accès propriétaire autorisé permette de corriger les privilèges par défaut.

## Blocage avant tout paiement réel

L'inventaire de `src/app/api` dans la branche d'intégration ne montre pas de route de webhook de paiement pour Moneroo, iPay ou Flutterwave. Aucune table `webhook_events` ou équivalente n'a été trouvée dans le schéma public. Les fonctions SQL peuvent créer une intention de paiement, mais l'application ne dispose pas encore d'un parcours complet vérifié de confirmation fournisseur, de vérification de signature et de traitement idempotent du webhook.

**Décision de sécurité :** garder les trois fournisseurs désactivés. Ne pas afficher un paiement comme confirmé sur la base d'une réponse navigateur et ne pas activer les paiements réels tant que le webhook fournisseur, la signature, l'idempotence et l'écriture du ledger n'ont pas été testés en sandbox.

## Travaux nécessaires pour clôturer

1. Confirmer le fournisseur retenu pour le Niger/XOF et obtenir ses spécifications officielles de webhook.
2. Ajouter les variables secrètes exclusivement côté serveur et vérifier leur présence sans exposer leurs valeurs.
3. Implémenter une route de webhook qui vérifie la signature, l'identifiant d'événement et l'état réel du paiement auprès du fournisseur.
4. Enregistrer les événements reçus de façon idempotente et empêcher les doubles crédits.
5. Mettre à jour paiement, commande, portefeuille et ledger dans une transaction serveur.
6. Tester succès, échec, répétition du webhook, signature invalide, montant/devise incohérents, remboursement et litige en environnement de test.
7. N'activer un fournisseur qu'après validation de tous ces scénarios.

Aucune transaction financière, aucun solde et aucune configuration fournisseur n'ont été modifiés pendant cet audit.
