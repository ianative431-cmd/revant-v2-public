import "server-only";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export type WhatsAppStatus = {
  status: "disconnected" | "connecting" | "connected" | "expired" | "error" | "unavailable";
  webhookStatus: "operational" | "error" | "not_configured";
  businessName: string | null;
  phoneNumberDisplay: string | null;
  metaBusinessId: string | null;
  wabaId: string | null;
  lastVerifiedAt: string | null;
  lastError: string | null;
  connectedAt: string | null;
  features: {
    whatsappLoginEnabled: boolean;
    verificationCodesEnabled: boolean;
    notificationsEnabled: boolean;
    autoRepliesEnabled: boolean;
    aiAssistantEnabled: boolean;
    humanHandoffEnabled: boolean;
  };
  /** true si META_APP_ID / META_APP_SECRET sont définis côté serveur. */
  metaAppConfigured: boolean;
};

/**
 * Lit l'état réel de la connexion WhatsApp Business. La table
 * whatsapp_connection n'a aucune policy RLS (deny-all pour
 * anon/authenticated) — ce module passe donc par le client service
 * role, après que la page appelante ait vérifié requireSuperAdmin().
 * Aucune donnée simulée : si la ligne n'existe pas, erreur explicite
 * plutôt qu'un faux état "déconnecté".
 */
export async function getWhatsAppStatus(): Promise<WhatsAppStatus> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("whatsapp_connection")
    .select("*")
    .eq("id", 1)
    .single();

  if (error || !data) {
    throw new Error(
      `Impossible de charger l'état de la connexion WhatsApp : ${error?.message ?? "ligne introuvable"}`
    );
  }

  return {
    status: data.status,
    webhookStatus: data.webhook_status,
    businessName: data.business_name,
    phoneNumberDisplay: data.phone_number_display,
    metaBusinessId: data.meta_business_id,
    wabaId: data.waba_id,
    lastVerifiedAt: data.last_verified_at,
    lastError: data.last_error,
    connectedAt: data.connected_at,
    features: {
      whatsappLoginEnabled: data.whatsapp_login_enabled,
      verificationCodesEnabled: data.verification_codes_enabled,
      notificationsEnabled: data.notifications_enabled,
      autoRepliesEnabled: data.auto_replies_enabled,
      aiAssistantEnabled: data.ai_assistant_enabled,
      humanHandoffEnabled: data.human_handoff_enabled,
    },
    metaAppConfigured: Boolean(process.env.META_APP_ID && process.env.META_APP_SECRET),
  };
}

/** Valeurs publiques nécessaires au bouton Embedded Signup côté client. */
export function getMetaClientConfig(): { appId: string | null; configId: string | null } {
  return {
    appId: process.env.NEXT_PUBLIC_META_APP_ID ?? null,
    configId: process.env.NEXT_PUBLIC_META_CONFIG_ID ?? null,
  };
}
