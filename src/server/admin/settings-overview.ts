import "server-only";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { requirePermission } from "@/server/auth/roles";
import type { Tables } from "@/types/database";

type SettingRow = Pick<Tables<"system_settings">, "key" | "value_type" | "description" | "is_public" | "updated_at">;
type PublicSettingValue = Pick<Tables<"system_settings">, "key" | "value">;
type ProviderRow = Pick<Tables<"payment_providers">, "code" | "name" | "enabled" | "supported_currencies">;
type WithdrawalRuleRow = Pick<Tables<"withdrawal_rules">, "currency" | "min_amount" | "max_amount" | "fee_amount" | "fee_percent" | "kyc_required" | "manual_approval_required" | "enabled">;

export async function getAdminSettingsOverview() {
  await requirePermission("settings.manage");
  const admin = createSupabaseAdminClient();
  const [settingsResult, publicValuesResult, providersResult, rulesResult] = await Promise.all([
    admin.from("system_settings").select("key,value_type,description,is_public,updated_at").order("key"),
    admin.from("system_settings").select("key,value").eq("is_public", true).order("key"),
    admin.from("payment_providers").select("code,name,enabled,supported_currencies").order("name"),
    admin.from("withdrawal_rules").select("currency,min_amount,max_amount,fee_amount,fee_percent,kyc_required,manual_approval_required,enabled").order("currency"),
  ]);
  if (settingsResult.error || publicValuesResult.error || providersResult.error || rulesResult.error) {
    throw new Error("Impossible de charger les paramètres de plateforme.");
  }
  return {
    settings: (settingsResult.data ?? []) as SettingRow[],
    publicValues: (publicValuesResult.data ?? []) as PublicSettingValue[],
    providers: (providersResult.data ?? []) as ProviderRow[],
    withdrawalRules: (rulesResult.data ?? []) as WithdrawalRuleRow[],
  };
}
