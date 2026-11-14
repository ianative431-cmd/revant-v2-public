"use server";

import { revalidatePath } from "next/cache";
import { createHash, randomInt } from "node:crypto";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { encryptDeliveryCode } from "@/server/delivery/code-crypto.mjs";
import { requireUserWithLegalConsent } from "@/server/legal/consent";
import { sendAppleLiveActivityUpdateForDelivery } from "@/server/services/notifications/apple-live-activity";

export type DeliveryActionState = { error: string | null; success?: boolean };

type DeliveryRpc = {
  rpc: (name: string, args: Record<string, string>) => Promise<{
    data: unknown;
    error: { message: string } | null;
  }>;
};

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function deliveryError(message: string, fallback: string) {
  if (message.includes("active_driver_required")) return "Ton compte n’est pas encore activé comme livreur.";
  if (message.includes("delivery_already_claimed") || message.includes("delivery_not_available")) return "Cette livraison n’est plus disponible.";
  if (message.includes("delivery_not_assigned_to_driver")) return "Cette livraison ne t’est pas attribuée.";
  if (message.includes("invalid_delivery_transition")) return "Cette étape de livraison n’est pas autorisée.";
  if (message.includes("delivery_code_locked")) return "Trop de codes incorrects. Réessaie dans 15 minutes.";
  if (message.includes("delivery_not_in_transit")) return "La livraison doit être en route avant la confirmation.";
  if (message.includes("order_not_ready_for_delivery")) return "La commande n’est pas encore prête à être livrée.";
  if (message.includes("no_active_drivers")) return "Aucun livreur actif n’est disponible pour le moment.";
  if (message.includes("delivery_already_requested")) return "Un livreur a déjà été demandé pour cette commande.";
  if (message.includes("order_not_ready_or_forbidden")) return "La commande doit être confirmée par ton compte vendeur avant de demander un livreur.";
  if (message.includes("delivery_address_missing")) return "L’adresse de livraison est incomplète. Vérifie les coordonnées de l’acheteur.";
  if (message.includes("invalid_order_shop_scope")) return "Une commande doit appartenir à une seule boutique pour organiser la livraison.";
  if (message.includes("forbidden")) return "Tu n’es pas autorisé à effectuer cette action.";
  return fallback;
}

async function callDeliveryRpc(name: string, args: Record<string, string>, fallback: string) {
  await requireUserWithLegalConsent();
  const supabase = await createSupabaseServerClient();
  const rpc = supabase as unknown as DeliveryRpc;
  const result = await rpc.rpc(name, args);
  if (result.error) return { data: null, error: deliveryError(result.error.message, fallback) };
  return { data: result.data, error: null };
}

export async function requestDeliveryForOrder(
  _previousState: DeliveryActionState,
  formData: FormData
): Promise<DeliveryActionState> {
  const user = await requireUserWithLegalConsent();
  const orderId = String(formData.get("orderId") ?? "").trim();
  if (!UUID_PATTERN.test(orderId)) return { error: "Référence de commande invalide." };
  const secret = process.env.DELIVERY_CODE_ENCRYPTION_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secret || secret.length < 32) return { error: "La clé serveur de sécurisation du code de remise n’est pas configurée." };

  const code = randomInt(0, 1_000_000).toString().padStart(6, "0");
  const codeHash = createHash("sha256").update(code, "utf8").digest("hex");
  const codeCiphertext = encryptDeliveryCode(code, secret);
  const admin = createSupabaseAdminClient();
  const rpc = admin as unknown as DeliveryRpc;
  const { data, error } = await rpc.rpc("seller_request_delivery", {
    p_order_id: orderId,
    p_actor_id: user.id,
    p_code_hash: codeHash,
    p_code_ciphertext: codeCiphertext,
    p_code_hint: code.slice(-2),
  });
  if (error) return { error: deliveryError(error.message, "Impossible de demander un livreur.") };
  const count = Number(data ?? 0);
  if (count < 1) return { error: "Aucun livreur n’a reçu la demande. Réessaie plus tard." };
  revalidatePath("/compte/boutique/commandes");
  revalidatePath("/compte/livraisons");
  revalidatePath("/compte/commandes");
  revalidatePath("/compte/notifications");
  return { error: null, success: true };
}

export async function claimDelivery(
  _previousState: DeliveryActionState,
  formData: FormData
): Promise<DeliveryActionState> {
  const deliveryId = String(formData.get("deliveryId") ?? "").trim();
  if (!UUID_PATTERN.test(deliveryId)) return { error: "Référence de livraison invalide." };
  const result = await callDeliveryRpc("driver_claim_delivery", { p_delivery_id: deliveryId }, "Impossible de prendre cette livraison.");
  if (result.error) return { error: result.error };
  await sendAppleLiveActivityUpdateForDelivery(deliveryId, {
    event: "update",
    status: "Livreur assigné",
    detail: "Un livreur a pris en charge la livraison.",
    etaLabel: "Suivi en direct",
    progress: 0.25,
  });
  revalidatePath("/compte/livraisons");
  revalidatePath("/compte/boutique/commandes");
  revalidatePath("/compte/notifications");
  return { error: null, success: true };
}

export async function updateDeliveryStatus(
  _previousState: DeliveryActionState,
  formData: FormData
): Promise<DeliveryActionState> {
  const deliveryId = String(formData.get("deliveryId") ?? "").trim();
  const status = String(formData.get("status") ?? "");
  if (!UUID_PATTERN.test(deliveryId)) return { error: "Référence de livraison invalide." };
  if (status !== "picked_up" && status !== "in_transit" && status !== "failed") return { error: "Étape de livraison invalide." };
  const result = await callDeliveryRpc("driver_update_delivery_status", { p_delivery_id: deliveryId, p_status: status }, "Impossible de mettre à jour la livraison.");
  if (result.error) return { error: result.error };

  const liveState = status === "picked_up"
    ? { status: "Commande récupérée", detail: "Le livreur a récupéré la commande.", etaLabel: "Suivi en direct", progress: 0.55 }
    : status === "in_transit"
      ? { status: "En route", detail: "La commande est en route vers toi.", etaLabel: "Suivi en direct", progress: 0.85 }
      : { status: "Incident de livraison", detail: "Un incident a été signalé. Revant suit la situation.", etaLabel: "Mise à jour nécessaire", progress: 0.85 };

  await sendAppleLiveActivityUpdateForDelivery(deliveryId, { event: "update", ...liveState });
  revalidatePath("/compte/livraisons");
  revalidatePath("/compte/commandes");
  revalidatePath("/compte/boutique/commandes");
  revalidatePath("/compte/notifications");
  return { error: null, success: true };
}

export async function confirmDeliveryCode(
  _previousState: DeliveryActionState,
  formData: FormData
): Promise<DeliveryActionState> {
  const deliveryId = String(formData.get("deliveryId") ?? "").trim();
  const code = String(formData.get("code") ?? "").trim();
  if (!UUID_PATTERN.test(deliveryId)) return { error: "Référence de livraison invalide." };
  if (!/^[0-9]{4}([0-9]{2})?$/.test(code)) return { error: "Le code doit contenir 4 ou 6 chiffres." };
  const result = await callDeliveryRpc("driver_confirm_delivery_code", { p_delivery_id: deliveryId, p_code: code }, "Impossible de confirmer la remise.");
  if (result.error) return { error: result.error };
  if (result.data !== true) return { error: "Code incorrect. Demande à l’acheteur de vérifier son code de remise." };

  await sendAppleLiveActivityUpdateForDelivery(deliveryId, {
    event: "end",
    status: "Livrée",
    detail: "La commande a été remise.",
    etaLabel: "Terminée",
    progress: 1,
  });
  revalidatePath("/compte/livraisons");
  revalidatePath("/compte/commandes");
  revalidatePath("/compte/boutique/commandes");
  revalidatePath("/compte/notifications");
  return { error: null, success: true };
}
