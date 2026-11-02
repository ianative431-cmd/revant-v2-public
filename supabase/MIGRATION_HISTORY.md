# Réconciliation de l'historique Supabase Revant

État vérifié le 2 novembre 2026 sur le projet Revant (`xugcmpnrigqfszyfufoc`). Les versions listées ci-dessous ont été comparées à l'historique réel de `supabase_migrations.schema_migrations`.

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

## Migrations appliquées et vérifiées le 2 novembre 2026

| Version enregistrée | Migration | Vérification |
|---|---|---|
| `20261102060639` | `secure_user_notification_inbox` | RPC de lecture accessibles aux utilisateurs connectés ; écriture directe retirée aux rôles `anon` et `authenticated`. |
| `20261102060740` | `atomic_guest_checkout_and_order_transitions` | Colonnes d'idempotence et de réservation présentes ; RPC de commande invité réservé à `service_role`. |
| `20261102060742` | `secure_delivery_driver_workflow` | Codes de remise déplacés dans `private.delivery_code_secrets` ; anciennes colonnes publiques supprimées ; RPC livreur contrôlés. |

Les tables de commandes, lignes de commande et livraisons étaient vides avant ces changements et le sont toujours après vérification.

## Migrations encore en attente

- `20261027190000_social_publishing_calendar.sql` : à examiner et appliquer séparément après vérification de ses dépendances.
- `20261101172017_require_aal2_for_super_admin.sql` : **ne pas appliquer avant l'inscription et la vérification du facteur TOTP du super-administrateur**. Le compte super-admin actuel ne possède pas de facteur TOTP vérifié ; l'application immédiate pourrait donc bloquer l'accès à l'administration.

## Écart à résoudre : migration KYC

Supabase enregistre déjà la version `20261101130806` (`kyc_document_review_workflow`), mais le fichier SQL correspondant n'a pas été retrouvé dans les fichiers suivis de la branche contrôlée. Ne pas recréer ni rejouer cette migration à l'aveugle. Il faut récupérer son SQL historique ou reconstituer un fichier de référence à partir du schéma réel, sans réappliquer ses changements.

## Règle d'exploitation

Ne pas lancer `supabase db push` sur le projet de production sans comparaison préalable des versions locales et distantes. Toute migration doit être revue, appliquée dans l'ordre, puis vérifiée par la présence de sa version, de ses objets et de ses privilèges.
