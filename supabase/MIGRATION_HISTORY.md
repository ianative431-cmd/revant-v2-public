# Historique des migrations Supabase — Revant

État vérifié le 3 novembre 2026 (UTC) sur le projet `xugcmpnrigqfszyfufoc`.

## Règles de sécurité

- **Ne pas lancer `supabase db push` sur la production** tant que les sources manquantes ci-dessous ne sont pas retrouvées et réconciliées.
- Cette PR ne change pas la base : elle renomme, archive et restaure des fichiers SQL déjà appliqués. Aucun SQL n'est exécuté.
- Supabase enregistre 64 migrations. Après cette réconciliation, 35 migrations appliquées disposent d'un fichier source local dont le préfixe/version correspond exactement; 29 sources restent introuvables dans `main` et les branches historiques contrôlées.
- Ne jamais recréer ces 29 fichiers à partir de suppositions ni les rejouer. Les noms distants sont listés plus bas pour faciliter une récupération future.
- Les anciennes migrations `0001` à `0011` sont archivées car elles ne figurent pas dans l'historique distant actuel et décrivent un ancien modèle incompatible.

## Fichiers renommés pour correspondre aux versions distantes

| Ancien fichier | Nouveau fichier |
|---|---|
| `20261010213000_guest_checkout.sql` | `20261010211419_guest_checkout.sql` |
| `20261011093000_product_variants_and_perfumes.sql` | `20261011150630_product_variants_and_perfumes.sql` |
| `20261011094500_product_sizes_and_perfume_details.sql` | `20261011150642_product_sizes_and_perfume_details.sql` |
| `20261101114600_revoke_dangerous_public_table_privileges.sql` | `20261101104547_revoke_dangerous_public_table_privileges.sql` |
| `20261101114900_explicitly_deny_api_access_to_rate_limit_attempts.sql` | `20261101104610_explicitly_deny_api_access_to_rate_limit_attempts.sql` |
| `20261101120000_enforce_admin_role_permissions.sql` | `20261101105035_enforce_admin_role_permissions.sql` |
| `20261101121500_move_guest_order_rpcs_to_server_role.sql` | `20261101105400_move_guest_order_rpcs_to_server_role.sql` |
| `20261101130100_fix_admin_operations_snapshot_kyc_sort.sql` | `20261101105501_fix_admin_operations_snapshot_kyc_sort.sql` |
| `20261101130500_temporary_guest_rpc_compatibility_for_live_release.sql` | `20261101105635_temporary_guest_rpc_compatibility_for_live_release.sql` |
| `20261101131000_add_private_guest_order_implementations.sql` | `20261101105748_add_private_guest_order_implementations.sql` |
| `20261101131500_convert_guest_order_public_rpcs_to_invoker.sql` | `20261101105752_convert_guest_order_public_rpcs_to_invoker.sql` |
| `20261101132000_prevent_guest_rpc_buyer_id_spoofing.sql` | `20261101105805_prevent_guest_rpc_buyer_id_spoofing.sql` |
| `20261101140000_harden_financial_and_sensitive_table_grants.sql` | `20261101115341_harden_financial_and_sensitive_table_grants.sql` |
| `20261101140500_preserve_kyc_history.sql` | `20261101115400_preserve_kyc_history.sql` |
| `20261101143000_admin_actions_append_only.sql` | `20261101115735_admin_actions_append_only.sql` |
| `20261102163800_fix_associate_role_rpc.sql` | `20261102164310_fix_associate_role_rpc.sql` |

## Sources restaurées depuis la branche d'intégration

- `supabase/migrations/20261102060639_secure_user_notification_inbox.sql` — déjà appliquée sur le projet distant; source restaurée, ne pas rejouer.
- `supabase/migrations/20261102060740_atomic_guest_checkout_and_order_transitions.sql` — déjà appliquée sur le projet distant; source restaurée, ne pas rejouer.
- `supabase/migrations/20261102060742_secure_delivery_driver_workflow.sql` — déjà appliquée sur le projet distant; source restaurée, ne pas rejouer.
- `supabase/migrations/20261102062731_lock_down_admin_finance_summary.sql` — déjà appliquée sur le projet distant; source restaurée, ne pas rejouer.
- `supabase/migrations/20261102062938_revoke_anon_existing_public_writes.sql` — déjà appliquée sur le projet distant; source restaurée, ne pas rejouer.

## Anciennes migrations archivées

Les fichiers `0001` à `0011` sont conservés dans `supabase/legacy_migrations_archive/`. Lire le README de ce dossier. **Ne pas les déplacer dans `supabase/migrations` et ne pas les exécuter.**

## Migration en attente — MFA Super Admin

`supabase/pending_migrations/20261101172017_require_aal2_for_super_admin.sql` n'est pas une migration active. Ne pas la déplacer vers `supabase/migrations` et ne pas l'appliquer avant qu'un facteur TOTP du compte super-admin soit inscrit et vérifié. La base vérifiée ne possède actuellement aucun facteur TOTP vérifié pour ce rôle.

## Migration shop-media

Le fichier `supabase/migrations/20261102234204_20261102133000_shop_media_storage.sql` correspond à la ligne distante version `20261102234204`, nom `20261102133000_shop_media_storage`. Elle a déjà été appliquée et vérifiée; ne pas la rejouer.

## Sources SQL distantes non retrouvées

Ces 29 versions figurent dans l'historique Supabase mais aucun fichier SQL correspondant n'a été trouvé dans `main` ou les branches historiques contrôlées :

- `20260928110300_revant_core_foundation.sql`
- `20260928110736_revant_orders_finance_foundation.sql`
- `20260928150030_admin_finance_payout_actions.sql`
- `20260928150131_expose_admin_payout_wrapper.sql`
- `20260928183302_payment_finance_release_triggers.sql`
- `20260928183309_payment_intent_frontend_rpc_guard.sql`
- `20261003200735_wallet_blocked_withdrawn_and_audit_actions.sql`
- `20261003200943_finance_totals_function.sql`
- `20261003201113_admin_set_setting_with_audit.sql`
- `20261005194846_handle_new_user_set_last_name.sql`
- `20261007102420_decrement_product_stock_function.sql`
- `20261007152349_admin_user_directory_and_shops_list_rpcs.sql`
- `20261008045416_whatsapp_business_integration.sql`
- `20261008110810_add_phone_country_settings.sql`
- `20261008110845_add_phone_country_configuration.sql`
- `20261010145334_secure_whatsapp_tables_and_stock_rpc.sql`
- `20261010145347_harden_whatsapp_tables_and_stock_rpc.sql`
- `20261010145357_tighten_whatsapp_rls_and_stock_rpc_access.sql`
- `20261010205659_fix_admin_overview_snapshot_security.sql`
- `20261101095151_p0_payments_and_kyc_lockdown.sql`
- `20261101095325_p0_fix_admin_update_kyc.sql`
- `20261101095426_p0_finance_idempotent_release_and_payout_refund.sql`
- `20261101095506_p0_orders_seller_column_guard.sql`
- `20261101095529_p0_marketplace_and_profile_guards.sql`
- `20261101095626_p0_orders_rls_recursion_fix.sql`
- `20261101095658_p0_reviews_disputes_refunds_guards.sql`
- `20261101095733_p0_reviews_refunds_policy_fix.sql`
- `20261101095815_p0_rate_limiting_and_api_grants.sql`
- `20261101095900_p0_guards_no_admin_self_exemption.sql`

La base contient déjà le résultat de ces migrations. Cette liste est un inventaire de récupération, pas une instruction d'exécution.
