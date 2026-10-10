"use server";

import "server-only";
import { createHash } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { checkRateLimit, getClientIdentifier, RATE_LIMIT_ERROR_MESSAGE } from "@/server/security/rate-limit";

export type GuestOrderState = {
  error: string | null;
  success?: boolean;
  orderNumber?: string;
  totalAmount?: number;
};

export async function createGuestOrder(
  _previousState: GuestOrderState,
  formData: FormData
): Promise<GuestOrderState> {
  const productId = String(formData.get("productId") ?? "").trim();
  const name = String(formData.get("guestName") ?? "").trim();
  const phone = String(formData.get("guestPhone") ?? "").trim();
  const city = String(formData.get("guestCity") ?? "").trim();
  const address = String(formData.get("guestAddress") ?? "").trim();

  if (!/^[0-9a-f-]{36}$/i.test(productId)) return { error: "Produit invalide." };
  if (name.length < 2 || name.length > 120) return { error: "Indique ton nom complet." };
  if (!/^[+0-9][0-9 +().-]{7,23}$/.test(phone)) return { error: "Vérifie ton numéro de téléphone." };
  if (city.length < 2 || city.length > 120) return { error: "Indique ta ville." };
  if (address.length < 4 || address.length > 240) return { error: "Indique une adresse de livraison valide." };

  const ip = await getClientIdentifier();
  const ipHash = createHash("sha256").update(ip).digest("hex");
  if (!(await checkRateLimit(`guest-order:${ipHash}`, 5, 3600))) {
    return { error: RATE_LIMIT_ERROR_MESSAGE };
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    console.error("[guest-checkout] Supabase server configuration is missing.");
    return { error: "La commande est momentanément indisponible. Réessaie plus tard." };
  }

  const supabase = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data, error } = await supabase.rpc("create_guest_order", {
    p_product_id: productId,
    p_guest_name: name,
    p_guest_phone: phone,
    p_guest_city: city,
    p_guest_address: address,
  });

  if (error || !data || typeof data !== "object" || Array.isArray(data)) {
    console.error("[guest-checkout] Order creation failed:", error?.message ?? "empty result");
    if (error?.message.includes("product_unavailable")) {
      return { error: "Ce produit n'est plus disponible." };
    }
    if (error?.message.includes("orders_one_pending_per_product")) {
      return { error: "Une commande est déjà en attente pour cet article." };
    }
    return { error: "Impossible d'enregistrer la commande. Vérifie les informations et réessaie." };
  }

  const result = data as { order_number?: unknown; total_amount?: unknown };
  if (typeof result.order_number !== "string" || typeof result.total_amount !== "number") {
    return { error: "La commande a été enregistrée, mais son reçu n'a pas pu être préparé. Contacte la boutique." };
  }

  revalidatePath(`/produit/${productId}`);
  revalidatePath("/compte/boutique/commandes");
  return { error: null, success: true, orderNumber: result.order_number, totalAmount: result.total_amount };
}
