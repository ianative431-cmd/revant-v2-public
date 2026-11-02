-- Restored from the active Supabase catalog on 2026-11-02.
-- This migration is already applied to the active project; this file synchronizes repository history only.

CREATE INDEX revant_fk_addresses_user_id_idx ON public.addresses USING btree (user_id);
CREATE INDEX revant_fk_admin_sections_required_permission_idx ON public.admin_sections USING btree (required_permission);
CREATE INDEX revant_fk_categories_parent_id_idx ON public.categories USING btree (parent_id);
CREATE INDEX revant_fk_certifications_reviewed_by_idx ON public.certifications USING btree (reviewed_by);
CREATE INDEX revant_fk_conversations_seller_id_idx ON public.conversations USING btree (seller_id);
CREATE INDEX revant_fk_conversations_shop_id_idx ON public.conversations USING btree (shop_id);
CREATE INDEX revant_fk_deliveries_company_id_idx ON public.deliveries USING btree (company_id);
CREATE INDEX revant_fk_delivery_companies_owner_id_idx ON public.delivery_companies USING btree (owner_id);
CREATE INDEX revant_fk_disputes_assigned_to_idx ON public.disputes USING btree (assigned_to);
CREATE INDEX revant_fk_external_destination_links_created_by_idx ON public.external_destination_links USING btree (created_by);
CREATE INDEX revant_fk_external_destination_links_updated_by_idx ON public.external_destination_links USING btree (updated_by);
CREATE INDEX revant_fk_favorites_brand_id_idx ON public.favorites USING btree (brand_id);
CREATE INDEX revant_fk_favorites_product_id_idx ON public.favorites USING btree (product_id);
CREATE INDEX revant_fk_favorites_shop_id_idx ON public.favorites USING btree (shop_id);
CREATE INDEX revant_fk_kyc_profiles_reviewed_by_idx ON public.kyc_profiles USING btree (reviewed_by);
CREATE INDEX revant_fk_ledger_entries_order_id_idx ON public.ledger_entries USING btree (order_id);
CREATE INDEX revant_fk_messages_order_id_idx ON public.messages USING btree (order_id);
CREATE INDEX revant_fk_messages_product_id_idx ON public.messages USING btree (product_id);
CREATE INDEX revant_fk_messages_sender_id_idx ON public.messages USING btree (sender_id);
CREATE INDEX revant_fk_order_items_product_id_idx ON public.order_items USING btree (product_id);
CREATE INDEX revant_fk_orders_shipping_address_id_idx ON public.orders USING btree (shipping_address_id);
CREATE INDEX revant_fk_phone_country_settings_updated_by_idx ON public.phone_country_settings USING btree (updated_by);
CREATE INDEX revant_fk_referrals_referred_user_id_idx ON public.referrals USING btree (referred_user_id);
CREATE INDEX revant_fk_refunds_requested_by_idx ON public.refunds USING btree (requested_by);
CREATE INDEX revant_fk_reports_assigned_to_idx ON public.reports USING btree (assigned_to);
CREATE INDEX revant_fk_reviews_order_id_idx ON public.reviews USING btree (order_id);
CREATE INDEX revant_fk_reviews_user_id_idx ON public.reviews USING btree (user_id);
CREATE INDEX revant_fk_role_permissions_permission_id_idx ON public.role_permissions USING btree (permission_id);
CREATE INDEX revant_fk_social_posts_owner_id_idx ON public.social_posts USING btree (owner_id);
CREATE INDEX revant_fk_store_subscriptions_shop_id_idx ON public.store_subscriptions USING btree (shop_id);
CREATE INDEX revant_fk_support_messages_sender_id_idx ON public.support_messages USING btree (sender_id);
CREATE INDEX revant_fk_support_tickets_assigned_to_idx ON public.support_tickets USING btree (assigned_to);
CREATE INDEX revant_fk_system_settings_updated_by_idx ON public.system_settings USING btree (updated_by);
CREATE INDEX revant_fk_whatsapp_connection_connected_by_idx ON public.whatsapp_connection USING btree (connected_by);
CREATE INDEX revant_fk_withdrawal_rules_updated_by_idx ON public.withdrawal_rules USING btree (updated_by);
