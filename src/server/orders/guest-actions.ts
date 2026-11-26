"use server";

import { createHash } from "node:crypto";
import {
  createGuestCartTrackingToken,
  createGuestOrderTrackingToken,
  hashGuestTrackingToken,
} from "@/server/orders/guest-token.mjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  checkRateLimit,
  getClientIdentifier,
} from "@/server/security/rate-limit";

type GuestOrderRpc = {
  rpc: (name: string, args: Record<string, unknown>) => Promise<{
    data: { order_id: string; order_number: string } | null;
    error: { message: string } | null;
  }>;
};

type GuestCartLine = {
  product_id: string;
  quantity: number;
  variant_label: string | null;
};

const UUID_V4_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function normalizeGuestCart(raw: string): GuestCartLine[] | null {
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length < 1 || parsed.length > 20) return null;
    const items = parsed.map((entry): GuestCartLine | null => {
      if (!entry || typeof entry !== "object") return null;
      const value = entry as Record<string, unknown>;
      const productId = String(value.product_id ?? value.productId ?? value.id ?? "").trim();
      const quantity = Number(value.quantity);
      const variant = value.variant_label ?? value.variantLabel ?? null;
      const variantLabel = variant === null || variant === undefined || String(variant).trim() === ""
        ? null
        : String(variant).trim();
      if (!UUID_PATTERN.test(productId) || !Number.isSafeInteger(quantity) || quantity < 1 || quantity > 99) return null;
      if (variantLabel !== null && variantLabel.length > 50) return null;
      return { product_id: productId.toLowerCase(), quantity, variant_label: variantLabel };
    });
    if (items.some((item) => item === null)) return null;
    const normalized = items as GuestCartLine[];
    const keys = normalized.map((item) => `${item.product_id}::${item.variant_label ?? ""}`);
    if (new Set(keys).size !== keys.length) return null;
    return normalized.sort((a, b) =>
      a.product_id.localeCompare(b.product_id) ||
      (a.variant_label ?? "").localeCompare(b.variant_label ?? "")
    );
  } catch {
    return null;
  }
}

async function checkGuestCheckoutRateLimit(phone: string): Promise<boolean> {
  const normalizedPhone = phone.replace(/[^0-9]/g, "");
  const phoneKey = createHash("sha256").update(normalizedPhone).digest("hex");
  const ip = await getClientIdentifier();
  const checks: Promise<boolean>[] = [
    checkRateLimit(`guest-checkout:phone:${phoneKey}`, 3, 3600),
  ];
  if (ip && ip !== "unknown") {
    const ipKey = createHash("sha256").update(ip).digest("hex");
    checks.push(checkRateLimit(`guest-checkout:ip:${ipKey}`, 10, 900));
  }
  const allowed = await Promise.all(checks);
  return allowed.every(Boolean);
}

function checkoutErrorUrl(items: GuestCartLine[], code: string): string {
  const params = new URLSearchParams({
    items: JSON.stringify(items.map((item) => ({
      productId: item.product_id,
      quantity: item.quantity,
      variantLabel: item.variant_label,
    }))),
    erreur: code,
  });
  return `/commande/panier?${params.toString()}`;
}

export async function createGuestOrder(formData: FormData): Promise<never> {
  const productId = String(formData.get("productId") ?? "").trim();
  const quantity = Number(formData.get("quantity") ?? "1");
  const variantLabel = String(formData.get("variantLabel") ?? "").trim() || null;
  const idempotencyKey = String(formData.get("idempotencyKey") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const city = String(formData.get("city") ?? "").trim();
  const address = String(formData.get("address") ?? "").trim();
  const website = String(formData.get("website") ?? "").trim();

  if (!productId || !Number.isSafeInteger(quantity) || quantity < 1 || quantity > 99 || !UUID_V4_PATTERN.test(idempotencyKey) || name.length < 2 || name.length > 100 || phone.length < 8 || phone.length > 24 || city.length < 2 || city.length > 100 || address.length < 5 || address.length > 300) {
    redirect(`/commande/visiteur?productId=${encodeURIComponent(productId)}&erreur=validation`);
  }

  if (variantLabel !== null && variantLabel.length > 50) {
    redirect(`/commande/visiteur?productId=${encodeURIComponent(productId)}&quantity=${quantity}&erreur=variant`);
  }

  if (!(await checkGuestCheckoutRateLimit(phone))) {
    redirect(`/commande/visiteur?productId=${encodeURIComponent(productId)}&quantity=${quantity}&erreur=commande`);
  }

  const tokenSecret = process.env.GUEST_ORDER_TOKEN_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!tokenSecret || tokenSecret.length < 32) {
    redirect(`/commande/visiteur?productId=${encodeURIComponent(productId)}&quantity=${quantity}&erreur=commande`);
  }
  const token = createGuestOrderTrackingToken(idempotencyKey, quantity, tokenSecret, variantLabel);
  const tokenHash = hashGuestTrackingToken(token);
  const sessionSupabase = await createSupabaseServerClient();
  const { data: { user } } = await sessionSupabase.auth.getUser();
  const supabase = createSupabaseAdminClient();
  const guestRpc = supabase as unknown as GuestOrderRpc;
  const { data, error } = await guestRpc.rpc("create_guest_order", {
    p_product_id: productId,
    p_guest_name: name,
    p_guest_phone: phone,
    p_guest_city: city,
    p_guest_address: address,
    p_tracking_token_hash: tokenHash,
    p_website: website,
    p_idempotency_key: idempotencyKey,
    p_buyer_id: user?.id ?? null,
    p_quantity: quantity,
    p_variant_label: variantLabel,
  });

  if (error || !data?.order_number) {
    const code = error?.message.includes("product unavailable") ? "stock" : error?.message.includes("variant") ? "variant" : "commande";
    redirect(`/commande/visiteur?productId=${encodeURIComponent(productId)}&quantity=${quantity}&erreur=${code}`);
  }

  const cookieStore = await cookies();
  cookieStore.set(`revant_guest_${data.order_number}`, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/commande/confirmation",
    maxAge: 60 * 60 * 24 * 30,
  });
  revalidatePath("/");
  redirect(`/commande/confirmation?numero=${encodeURIComponent(data.order_number)}`);
}

export async function createGuestOrderBatch(formData: FormData): Promise<never> {
  const items = normalizeGuestCart(String(formData.get("items") ?? ""));
  const idempotencyKey = String(formData.get("idempotencyKey") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const city = String(formData.get("city") ?? "").trim();
  const address = String(formData.get("address") ?? "").trim();
  const website = String(formData.get("website") ?? "").trim();

  if (!items || !UUID_V4_PATTERN.test(idempotencyKey) || name.length < 2 || name.length > 100 || phone.length < 8 || phone.length > 24 || city.length < 2 || city.length > 100 || address.length < 5 || address.length > 300) {
    redirect("/panier?erreur=validation");
  }

  if (!(await checkGuestCheckoutRateLimit(phone))) {
    redirect(checkoutErrorUrl(items, "commande"));
  }

  const tokenSecret = process.env.GUEST_ORDER_TOKEN_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!tokenSecret || tokenSecret.length < 32) {
    redirect(checkoutErrorUrl(items, "commande"));
  }
  const cartFingerprint = createHash("sha256").update(JSON.stringify(items)).digest("hex");
  const token = createGuestCartTrackingToken(idempotencyKey, cartFingerprint, tokenSecret);
  const tokenHash = hashGuestTrackingToken(token);
  const sessionSupabase = await createSupabaseServerClient();
  const { data: { user } } = await sessionSupabase.auth.getUser();
  const supabase = createSupabaseAdminClient();
  const guestRpc = supabase as unknown as GuestOrderRpc;
  const { data, error } = await guestRpc.rpc("create_guest_order_batch", {
    p_items: items,
    p_guest_name: name,
    p_guest_phone: phone,
    p_guest_city: city,
    p_guest_address: address,
    p_tracking_token_hash: tokenHash,
    p_website: website,
    p_idempotency_key: idempotencyKey,
    p_buyer_id: user?.id ?? null,
  });

  if (error || !data?.order_number) {
    const message = error?.message ?? "";
    const code = message.includes("product unavailable") ? "stock"
      : message.includes("variant") ? "variant"
      : message.includes("mixed_shop") || message.includes("mixed_currency") ? "validation"
      : "commande";
    redirect(checkoutErrorUrl(items, code));
  }

  const cookieStore = await cookies();
  cookieStore.set(`revant_guest_${data.order_number}`, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/commande/confirmation",
    maxAge: 60 * 60 * 24 * 30,
  });
  revalidatePath("/");
  redirect(`/commande/confirmation?numero=${encodeURIComponent(data.order_number)}`);
}
