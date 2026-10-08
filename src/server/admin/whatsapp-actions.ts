"use server";

import { revalidatePath } from "next/cache";
import { requireSuperAdmin } from "@/server/auth/roles";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  exchangeCodeForToken,
  getFirstOwnedWaba,
  getFirstPhoneNumber,
  getSubscribedApps,
  verifyWabaAccess,
  MetaGraphError,
} from "@/server/integrations/meta-whatsapp";
import type { Database, Json } from "@/types/database";

export type WhatsAppActionState = { error: string | null; info?: string | null };

type AuditAction = Database["public"]["Enums"]["audit_action"];

/**
 * Trace un événement de connexion Meta dans audit_logs — jamais de
 * token ni de secret dans metadata, uniquement des informations
 * utiles au suivi (cf. exigence de journalisation sans secrets).
 */
async function logWhatsAppEvent(
  admin: Awaited<ReturnType<typeof requireSuperAdmin>>,
  action: AuditAction,
  description: string,
  metadata: Record<string, Json> = {}
) {
  const supabase = createSupabaseAdminClient();
  await supabase.from("audit_logs").insert({
    actor_id: admin.id,
    action,
    entity_type: "whatsapp_connection",
    description,
    metadata,
  });
}

/**
 * Reçoit le `code` renvoyé par l'Embedded Signup (côté client, après
 * FB.login) et termine la connexion côté serveur : échange du code,
 * repérage du WABA et du numéro existants, écriture de l'état non
 * sensible dans whatsapp_connection et du token dans whatsapp_secret
 * (jamais exposé au client). Ne crée jamais de nouveau compte/numéro
 * — se contente de lire ce qui existe déjà sur le Business Meta.
 */
export async function exchangeMetaCode(
  code: string,
  metaBusinessId: string
): Promise<WhatsAppActionState> {
  const admin = await requireSuperAdmin();
  const supabase = createSupabaseAdminClient();

  try {
    const { accessToken, expiresIn } = await exchangeCodeForToken(code);
    const { wabaId, businessName } = await getFirstOwnedWaba(accessToken, metaBusinessId);
    const phone = await getFirstPhoneNumber(accessToken, wabaId);

    await supabase
      .from("whatsapp_secret")
      .update({
        access_token: accessToken,
        token_expires_at: expiresIn ? new Date(Date.now() + expiresIn * 1000).toISOString() : null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", 1);

    await supabase
      .from("whatsapp_connection")
      .update({
        status: "connected",
        meta_business_id: metaBusinessId,
        waba_id: wabaId,
        business_name: businessName,
        phone_number_id: phone?.phoneNumberId ?? null,
        phone_number_display: phone?.displayNumber
          ? phone.displayNumber.replace(/\d(?=\d{2})/g, "•")
          : null,
        connected_at: new Date().toISOString(),
        connected_by: admin.id,
        last_verified_at: new Date().toISOString(),
        last_error: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", 1);

    await logWhatsAppEvent(admin, "create", "Connexion Meta WhatsApp Business réussie", {
      event: "meta_connect_success",
      waba_id: wabaId,
    });

    revalidatePath("/admin/whatsapp");
    return { error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur inconnue lors de la connexion.";
    await createSupabaseAdminClient()
      .from("whatsapp_connection")
      .update({ status: "error", last_error: message, updated_at: new Date().toISOString() })
      .eq("id", 1);
    await logWhatsAppEvent(admin, "update", "Connexion Meta WhatsApp Business échouée", {
      event: "meta_connect_failed",
      error: message,
    });
    revalidatePath("/admin/whatsapp");
    return { error: message };
  }
}

/**
 * Vérification réelle côté serveur auprès de Meta (pas juste
 * "une variable existe") : confirme que le token stocké fonctionne
 * encore en interrogeant le WABA.
 */
export async function verifyConnection(): Promise<WhatsAppActionState> {
  const admin = await requireSuperAdmin();
  const supabase = createSupabaseAdminClient();

  const { data: connection } = await supabase
    .from("whatsapp_connection")
    .select("waba_id")
    .eq("id", 1)
    .single();
  const { data: secret } = await supabase
    .from("whatsapp_secret")
    .select("access_token")
    .eq("id", 1)
    .single();

  if (!connection?.waba_id || !secret?.access_token) {
    return { error: "Aucune connexion WhatsApp active à vérifier." };
  }

  const result = await verifyWabaAccess(secret.access_token, connection.waba_id);
  const now = new Date().toISOString();

  if (result.ok) {
    await supabase
      .from("whatsapp_connection")
      .update({ status: "connected", last_verified_at: now, last_error: null, updated_at: now })
      .eq("id", 1);
    await logWhatsAppEvent(admin, "update", "Vérification de connexion Meta réussie", {
      event: "meta_verify_success",
    });
    revalidatePath("/admin/whatsapp");
    return { error: null, info: "Connexion vérifiée auprès de Meta : toujours active." };
  }

  await supabase
    .from("whatsapp_connection")
    .update({ status: "expired", last_error: result.error, updated_at: now })
    .eq("id", 1);
  await logWhatsAppEvent(admin, "update", "Vérification de connexion Meta échouée", {
    event: "meta_verify_failed",
    error: result.error,
  });
  revalidatePath("/admin/whatsapp");
  return { error: `Connexion invalide ou expirée : ${result.error}` };
}

/**
 * Test réel du webhook : confirme auprès de Meta (subscribed_apps)
 * que l'app Revant est bien abonnée aux événements de ce WABA.
 */
export async function testWebhook(): Promise<WhatsAppActionState> {
  const admin = await requireSuperAdmin();
  const supabase = createSupabaseAdminClient();

  const { data: connection } = await supabase
    .from("whatsapp_connection")
    .select("waba_id")
    .eq("id", 1)
    .single();
  const { data: secret } = await supabase
    .from("whatsapp_secret")
    .select("access_token")
    .eq("id", 1)
    .single();

  if (!connection?.waba_id || !secret?.access_token) {
    return { error: "Aucune connexion WhatsApp active : rien à tester." };
  }

  try {
    const apps = await getSubscribedApps(secret.access_token, connection.waba_id);
    const appId = process.env.META_APP_ID;
    const subscribed = apps.some((a) => a.whatsappBusinessApiData?.id === appId);
    const now = new Date().toISOString();

    await supabase
      .from("whatsapp_connection")
      .update({
        webhook_status: subscribed ? "operational" : "error",
        updated_at: now,
      })
      .eq("id", 1);
    await logWhatsAppEvent(
      admin,
      subscribed ? "update" : "update",
      subscribed ? "Webhook vérifié auprès de Meta" : "Webhook non abonné côté Meta",
      { event: subscribed ? "webhook_verified" : "webhook_error" }
    );
    revalidatePath("/admin/whatsapp");

    return subscribed
      ? { error: null, info: "Webhook confirmé opérationnel auprès de Meta." }
      : { error: "Meta indique qu'aucune app n'est abonnée aux webhooks de ce WABA." };
  } catch (err) {
    const message = err instanceof MetaGraphError ? err.message : "Erreur lors du test du webhook.";
    return { error: message };
  }
}

/**
 * Déconnexion : révoque le token stocké et repasse l'état à
 * "disconnected". Ne supprime jamais les autres données Revant.
 * La confirmation explicite est gérée côté client (window.confirm)
 * avant l'appel.
 */
export async function disconnectWhatsApp(): Promise<WhatsAppActionState> {
  const admin = await requireSuperAdmin();
  const supabase = createSupabaseAdminClient();
  const now = new Date().toISOString();

  await supabase
    .from("whatsapp_secret")
    .update({ access_token: null, token_expires_at: null, updated_at: now })
    .eq("id", 1);

  await supabase
    .from("whatsapp_connection")
    .update({
      status: "disconnected",
      webhook_status: "not_configured",
      last_error: null,
      updated_at: now,
    })
    .eq("id", 1);

  await logWhatsAppEvent(admin, "delete", "Déconnexion WhatsApp Business", {
    event: "meta_disconnected",
  });

  revalidatePath("/admin/whatsapp");
  return { error: null, info: "WhatsApp Business déconnecté." };
}

const TOGGLE_COLUMNS = {
  whatsappLogin: "whatsapp_login_enabled",
  verificationCodes: "verification_codes_enabled",
  notifications: "notifications_enabled",
  autoReplies: "auto_replies_enabled",
  aiAssistant: "ai_assistant_enabled",
  humanHandoff: "human_handoff_enabled",
} as const;

export type WhatsAppFeature = keyof typeof TOGGLE_COLUMNS;

/**
 * Active/désactive séparément une fonctionnalité WhatsApp. Le super
 * admin garde le contrôle complet, y compris pour couper
 * immédiatement l'assistant IA sans toucher au code.
 */
export async function toggleWhatsAppFeature(
  feature: WhatsAppFeature,
  enabled: boolean
): Promise<WhatsAppActionState> {
  const admin = await requireSuperAdmin();
  const column = TOGGLE_COLUMNS[feature];
  if (!column) return { error: "Fonctionnalité inconnue." };

  const supabase = createSupabaseAdminClient();
  const update = {
    [column]: enabled,
    updated_at: new Date().toISOString(),
  } as Database["public"]["Tables"]["whatsapp_connection"]["Update"];
  const { error } = await supabase.from("whatsapp_connection").update(update).eq("id", 1);

  if (error) return { error: `Impossible de modifier ce réglage : ${error.message}` };

  await logWhatsAppEvent(admin, "config_change", `Réglage ${feature} : ${enabled ? "activé" : "désactivé"}`, {
    event: "feature_toggle",
    feature,
    enabled,
  });

  revalidatePath("/admin/whatsapp");
  return { error: null };
}
