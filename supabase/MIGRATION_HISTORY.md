# Réconciliation de l'historique Supabase Revant

État vérifié le 1 novembre 2026 sur le projet Revant (`xugcmpnrigqfszyfufoc`). Cette note documente la correspondance entre des fichiers historiques du dépôt et les versions réellement enregistrées dans Supabase.

## Fichiers renommés pour correspondre aux versions déjà appliquées

Les fichiers ci-dessous ont été renommés pour utiliser la version présente dans `supabase_migrations.schema_migrations`. Leur SQL n'a pas été modifié par cette opération.

| Ancien préfixe local | Version déjà appliquée dans Supabase | Migration |
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

## Fichiers archivés

Les migrations historiques `0001` à `0011` ont été déplacées vers `supabase/legacy_migrations_archive/`. Elles ne figurent pas dans l'historique actuel de Supabase et ne doivent pas être rejouées sur le projet existant.

## Migrations présentes dans le dépôt mais pas encore enregistrées dans l'historique Supabase

À la date de vérification, les migrations suivantes restent en attente de revue et ne sont **pas appliquées** au projet :

- `20261027190000_social_publishing_calendar.sql`
- `20261101172017_require_aal2_for_super_admin.sql`
- `20261101183719_atomic_guest_checkout_and_order_transitions.sql`
- `20261101184508_secure_delivery_driver_workflow.sql`
- `20261101185053_secure_user_notification_inbox.sql`

Ne pas lancer `supabase db push` ni appliquer ces migrations avant une revue de leurs dépendances, des fonctions/RLS existantes et de l'ordre d'application. Aucune migration de ce lot n'a été exécutée pendant cette réconciliation.
