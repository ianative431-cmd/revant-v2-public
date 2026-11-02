# Réconciliation de l'historique Supabase Revant

État vérifié le 2 novembre 2026 sur le projet Revant (`xugcmpnrigqfszyfufoc`). Les versions locales ont été alignées sur les versions réellement enregistrées dans `supabase_migrations.schema_migrations`.

## Fichiers renommés pour correspondre aux versions déjà appliquées dans Supabase

| Ancien préfixe local | Version enregistrée dans Supabase | Migration |
|---|---|---|
| `20261010213000` | `20261010211419` | `guest_checkout` |
| `20261011093000` | `20261011150630` | `product_variants_and_perfumes` |
| `20261011094500` | `20261011150642` | `product_sizes_and_perfume_details` |
| `20261101114600` | `20261101104547` | `revoke_dangerous_public_table_privileges` |
| `20261101114900` | `20261101104610` | `explicitly_deny_api_access_to_rate_limit_attempts` |
| `20261101120000` | `20261101105035` | `enforce_admin_role_permissions` |
| `20261101121500` | `20261101105400` | `move_guest_order_rpcs_to_server_role` |
| `20261101130100` | `20261101105501` | `fix_admin_operations_snapshot_kyc_sort` |
| `20261101130500` | `20261101105635` | `temporary_guest_rpc_compatibility_for_live_release` |
| `20261101131000` | `20261101105748` | `add_private_guest_order_implementations` |
| `20261101131500` | `20261101105752` | `convert_guest_order_public_rpcs_to_invoker` |
| `20261101132000` | `20261101105805` | `prevent_guest_rpc_buyer_id_spoofing` |
| `20261101140000` | `20261101115341` | `harden_financial_and_sensitive_table_grants` |
| `20261101140500` | `20261101115400` | `preserve_kyc_history` |
| `20261101143000` | `20261101115735` | `admin_actions_append_only` |

## Migrations historiques archivées

Les migrations historiques `0001` à `0011` ont été déplacées vers `supabase/legacy_migrations_archive/`. Elles ne figurent pas dans l'historique actuel de Supabase et ne doivent pas être rejouées sur le projet existant.

## Migrations appliquées et vérifiées sur Supabase

Les noms de fichiers locaux ci-dessous correspondent maintenant exactement aux versions enregistrées côté Supabase. Ne pas rejouer ces migrations.

| Version locale et distante | Fichier |
|---|---|
| `20261101130806` | `20261101130806_kyc_document_review_workflow.sql` |
| `20261102060639` | `20261102060639_secure_user_notification_inbox.sql` |
| `20261102060740` | `20261102060740_atomic_guest_checkout_and_order_transitions.sql` |
| `20261102060742` | `20261102060742_secure_delivery_driver_workflow.sql` |
| `20261102062731` | `20261102062731_lock_down_admin_finance_summary.sql` |
| `20261102062938` | `20261102062938_revoke_anon_existing_public_writes.sql` |
| `20261102065549` | `20261102065549_secure_social_publishing_calendar.sql` |

Vérifications effectuées :
- Les RPC de notification sont disponibles aux utilisateurs connectés ; l'écriture directe est retirée aux rôles `anon` et `authenticated`.
- Les colonnes d'idempotence et de réservation des commandes sont présentes ; le RPC de commande invité est réservé à `service_role`.
- Les codes de remise sont conservés dans `private.delivery_code_secrets`, pas dans les anciennes colonnes publiques ; les RPC livreur sont contrôlés.
- La vue `public.admin_finance_summary` est une vue `security_invoker`. Ses droits directs ont été retirés à `anon` et `authenticated` ; le RPC d'administration continue de l'utiliser sous son propriétaire.
- Les privilèges `INSERT`, `UPDATE` et `DELETE` d'`anon` ont été retirés des tables existantes du schéma `public`. Le compte anonyme conserve la lecture publique prévue des boutiques et produits actifs.
- Après migration, il reste 0 privilège direct d'écriture `anon` sur les objets existants du schéma `public`.
- La table `social_posts` possède RLS activé et trois politiques limitées au propriétaire de la boutique. Les seuls droits API accordés sont `SELECT/INSERT/UPDATE` à `authenticated` ; aucun droit direct n'est accordé à `anon` ou `PUBLIC`. La fonction trigger est `SECURITY INVOKER` et n'est pas exécutable directement par les rôles API.
- Après application, l'advisor Supabase n'a signalé aucun nouveau finding lié à `social_posts`.

Les tables de commandes, lignes de commande et livraisons étaient vides avant les migrations du 2 novembre et le sont toujours après vérification.

## Limite de privilèges par défaut

La tentative de retirer les privilèges par défaut `INSERT/UPDATE/DELETE` pour `anon` aux rôles créateurs `postgres` et `supabase_admin` a été refusée par Supabase (`permission denied to change default privileges`). La migration non appliquée a été supprimée du dépôt ; aucune modification de privilèges par défaut n'a été faite.

En conséquence, toute nouvelle migration créant une table dans `public` doit explicitement retirer les privilèges d'écriture d'`anon` et activer RLS dans la même migration. Il faudra traiter le réglage global des privilèges par défaut avec un accès propriétaire autorisé avant de considérer cette protection comme définitive.

## Migrations encore en attente

- `20261101172017_require_aal2_for_super_admin.sql` : **ne pas appliquer avant l'inscription et la vérification du facteur TOTP du super-administrateur**. Le compte super-admin actuel ne possède pas de facteur TOTP vérifié ; l'application immédiate pourrait donc bloquer l'accès à l'administration.

## Règle d'exploitation

Ne pas lancer `supabase db push` sur le projet de production sans comparaison préalable des versions locales et distantes. Toute migration doit être revue, appliquée dans l'ordre, puis vérifiée par la présence de sa version, de ses objets et de ses privilèges.
