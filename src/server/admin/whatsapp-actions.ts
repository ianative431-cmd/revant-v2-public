"use server";

import { revalidatePath } from "next/cache";
import { requireSuperAdmin } from "@/server/auth/roles";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { exchangeCodeForToken, getFirstOwnedWaba, getFirstPhoneNumber, getSubscribedApps, verifyWabaAccess, MetaGraphError } from "@/server/integrations/meta-whatsapp";
import type { Database, Json } from "@/types/database";

export type WhatsAppActionState = { error: string | null; info?: string | null };
type AuditAction = Database["public"]["Enums"]["audit_action"];

function safeMetaError(error: unknown): string {
  if (error instanceof MetaGraphError) return \`Meta Graph API a renvoyé une erreur (HTTP \${error.status}).\`;
  return "Une erreur est survenue lors de la communication avec Meta.";
}

async function logWhatsAppEvent(admin: Awaited<ReturnType<typeof requireSuperAdmin>>, action: AuditAction, description: string, metadata: Record<string, Json> = {}) {
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("audit_logs").insert({
    actor_id: admin.id, action, entity_type: "whatsapp_connection", description, metadata,
  });
  return error;
}

export async function exchangeMetaCode(code: string, metaBusinessId: string): Promise<WhatsAppActionState> {
  const admin = await requireSuperAdmin();
  if (!code.trim() || code.length > 4096 || !metaBusinessId.trim() || metaBusinessId.length > 128) return { error: "Réponse de connexion Meta invalide." };
  const supabase = createSupabaseAdminClient();
  try {
    const { accessToken, expiresIn } = await exchangeCodeForToken(code);
    const { wabaId, businessName } = await getFirstOwnedWaba(accessToken, metaBusinessId);
    const phone = await getFirstPhoneNumber(accessToken, wabaId);
    const now = new Date().toISOString();
    const { error: secretError } = await supabase.from("whatsapp_secret").update({
      access_token: accessToken,
      token_expires_at: expiresIn ? new Date(Date.now() + expiresIn * 1000).toISOString() : null,
      updated_at: now,
    }).eq("id", 1);
    if (secretError) return { error: "Meta a autorisé la connexion, mais le jeton n’a pas pu être enregistré dans Revant." };

    const { error: connectionError } = await supabase.from("whatsapp_connection").update({
      status: "connected",
      meta_business_id: metaBusinessId,
      waba_id: wabaId,
      business_name: businessName,
      phone_number_id: phone?.phoneNumberId ?? null,
      phone_number_display: phone?.displayNumber ? phone.displayNumber.replace(/\d(?=\d{2})/g, "•") : null,
      connected_at: now,
      connected_by: admin.id,
      last_verified_at: now,
      last_error: null,
      updated_at: now,
    }).eq("id", 1);
    if (connectionError) return { error: "Le jeton a été enregistré, mais l’état de connexion n’a pas pu être mis à jour. Vérification administrative requise." };

    const auditError = await logWhatsAppEvent(admin, "create", "Connexion Meta WhatsApp Business réussie", {
      event: "meta_connect_success", waba_id: wabaId,
    });
    revalidatePath("/admin/whatsapp");
    if (auditError) return { error: "La connexion est enregistrée, mais son journal d’audit n’a pas pu être écrit." };
    return { error: null };
  } catch (error) {
    const safeError = safeMetaError(error);
    const { error: stateError } = await supabase.from("whatsapp_connection").update({
      status: "error", last_error: safeError, updated_at: new Date().toISOString(),
    }).eq("id", 1);
    const auditError = await logWhatsAppEvent(admin, "update", "Connexion Meta WhatsApp Business échouée", {
      event: "meta_connect_failed", error: safeError,
    });
    revalidatePath("/admin/whatsapp");
    if (stateError || auditError) return { error: \`\${safeError} L’état ou le journal d’audit n’a pas pu être entièrement enregistré.\` };
    return { error: safeError };
  }
}

export async function verifyConnection(): Promise<WhatsAppActionState> {
  const admin = await requireSuperAdmin();
  const supabase = createSupabaseAdminClient();
  const [connectionResult, secretResult] = await Promise.all([
    supabase.from("whatsapp_connection").select("waba_id").eq("id", 1).single(),
    supabase.from("whatsapp_secret").select("access_token").eq("id", 1).single(),
  ]);
  if (connectionResult.error || secretResult.error) return { error: "Impossible de lire la configuration WhatsApp enregistrée." };
  if (!connectionResult.data?.waba_id || !secretResult.data?.access_token) return { error: "Aucune connexion WhatsApp active à vérifier." };

  const result = await verifyWabaAccess(secretResult.data.access_token, connectionResult.data.waba_id);
  const safeError = result.ok ? null : "Meta n’a pas confirmé l’accès au compte WhatsApp Business.";
  const { error: updateError } = await supabase.from("whatsapp_connection").update({
    status: result.ok ? "connected" : "expired",
    last_verified_at: result.ok ? new Date().toISOString() : undefined,
    last_error: safeError,
    updated_at: new Date().toISOString(),
  }).eq("id", 1);
  if (updateError) return { error: "La vérification Meta a répondu, mais Revant n’a pas pu enregistrer son résultat." };
  const auditError = await logWhatsAppEvent(admin, "update", result.ok ? "Vérification de connexion Meta réussie" : "Vérification de connexion Meta échouée", {
    event: result.ok ? "meta_verify_success" : "meta_verify_failed",
    error: safeError,
  });
  revalidatePath("/admin/whatsapp");
  if (auditError) return { error: "Le résultat a été enregistré, mais le journal d’audit n’a pas pu être écrit." };
  return result.ok ? { error: null, info: "Connexion vérifiée auprès de Meta : toujours active." } : { error: safeError ?? "Vérification Meta échouée." };
}

export async function testWebhook(): Promise<WhatsAppActionState> {
  const admin = await requireSuperAdmin();
  const supabase = createSupabaseAdminClient();
  const [connectionResult, secretResult] = await Promise.all([
    supabase.from("whatsapp_connection").select("waba_id").eq("id", 1).single(),
    supabase.from("whatsapp_secret").select("access_token").eq("id", 1).single(),
  ]);
  if (connectionResult.error || secretResult.error) return { error: "Impossible de lire la configuration WhatsApp enregistrée." };
  if (!connectionResult.data?.waba_id || !secretResult.data?.access_token) return { error: "Aucune connexion WhatsApp active : rien à tester." };

  let subscribed = false;
  let safeError: string | null = null;
  try {
    const apps = await getSubscribedApps(secretResult.data.access_token, connectionResult.data.waba_id);
    const appId = process.env.META_APP_ID;
    subscribed = Boolean(appId && apps.some((app) => app.whatsappBusinessApiData?.id === appId));
    if (!subscribed) safeError = "Meta indique qu’aucune application Revant n’est abonnée aux webhooks de ce compte.";
  } catch (error) {
    safeError = safeMetaError(error);
  }

  const { error: updateError } = await supabase.from("whatsapp_connection").update({
    webhook_status: subscribed ? "operational" : "error",
    updated_at: new Date().toISOString(),
  }).eq("id", 1);
  if (updateError) return { error: "Le test webhook est terminé, mais Revant n’a pas pu enregistrer son résultat." };
  const auditError = await logWhatsAppEvent(admin, "update", subscribed ? "Webhook vérifié auprès de Meta" : "Webhook non confirmé auprès de Meta", {
    event: subscribed ? "webhook_verified" : "webhook_error",
    error: safeError,
  });
  revalidatePath("/admin/whatsapp");
  if (auditError) return { error: "Le résultat du webhook a été enregistré, mais le journal d’audit a échoué." };
  return subscribed ? { error: null, info: "Webhook confirmé opérationnel auprès de Meta." } : { error: safeError ?? "Webhook non confirmé." };
}

export async function disconnectWhatsApp(): Promise<WhatsAppActionState> {
  const admin = await requireSuperAdmin();
  const supabase = createSupabaseAdminClient();
  const now = new Date().toISOString();
  const { error: secretError } = await supabase.from("whatsapp_secret").update({
    access_token: null, token_expires_at: null, updated_at: now,
  }).eq("id", 1);
  if (secretError) return { error: "Le jeton WhatsApp n’a pas pu être supprimé." };

  const { error: connectionError } = await supabase.from("whatsapp_connection").update({
    status: "disconnected", webhook_status: "not_configured", last_error: null, updated_at: now,
  }).eq("id", 1);
  if (connectionError) return { error: "Le jeton a été supprimé, mais l’état de connexion n’a pas pu être actualisé." };

  const auditError = await logWhatsAppEvent(admin, "delete", "Déconnexion WhatsApp Business", { event: "meta_disconnected" });
  revalidatePath("/admin/whatsapp");
  if (auditError) return { error: "WhatsApp est déconnecté, mais la journalisation de l’intervention a échoué." };
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

export async function toggleWhatsAppFeature(feature: WhatsAppFeature, enabled: boolean): Promise<WhatsAppActionState> {
  const admin = await requireSuperAdmin();
  const column = TOGGLE_COLUMNS[feature];
  if (!column) return { error: "Fonctionnalité inconnue." };
  if (feature === "whatsappLogin" && enabled) return { error: "La connexion WhatsApp ne peut pas être activée avant le branchement du hook SMS Supabase et l’approbation du modèle OTP Authentication dans Meta." };

  const supabase = createSupabaseAdminClient();
  const update = { [column]: enabled, updated_at: new Date().toISOString() } as Database["public"]["Tables"]["whatsapp_connection"]["Update"];
  const { error } = await supabase.from("whatsapp_connection").update(update).eq("id", 1);
  if (error) return { error: \`Impossible de modifier ce réglage : \${error.message}\` };

  const auditError = await logWhatsAppEvent(admin, "config_change", \`Réglage \${feature} : \${enabled ? "activé" : "désactivé"}\`, {
    event: "feature_toggle", feature, enabled,
  });
  revalidatePath("/admin/whatsapp");
  if (auditError) return { error: "Le réglage a été modifié, mais son journal d’audit n’a pas pu être écrit." };
  return { error: null };
}