"use server";

import { createHash, createHmac } from "node:crypto";
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
  rpc: (name: string, args: Record<string, string | number | null>) => Promise<{
    data: { order_id: string; order_number: string } | null;
    error: { message: string } | null;
  }>;
};

export async function createGuestOrder(formData: FormData): Promise<never> {
  const productId = String(formData.get("productId") ?? "").trim();
  const quantity = Number(formData.get("quantity") ?? "1");
  const idempotencyKey = String(formData.get("idempotencyKey") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const city = String(formData.get("city") ?? "").trim();
  const address = String(formData.get("address") ?? "").trim();
  const website = String(formData.get("website") ?? "").trim();

  if (!productId || !Number.isSafeInteger(quantity) || quantity < 1 || quantity > 99 || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(idempotencyKey) || name.length < 2 || name.length > 100 || phone.length < 8 || phone.length > 24 || city.length < 2 || city.length > 100 || address.length < 5 || address.length > 300) {
    redirect(`/commande/visiteur?productId=${encodeURIComponent(productId)}&erreur=validation`);
  }

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
  if (allowed.some((isAllowed) => !isAllowed)) {
    redirect(`/commande/visiteur?productId=${encodeURIComponent(productId)}&quantity=${quantity}&erreur=commande`);
  }

  const tokenSecret = process.env.GUEST_ORDER_TOKEN_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!tokenSecret || tokenSecret.length < 32) {
    redirect(`/commande/visiteur?productId=${encodeURIComponent(productId)}&quantity=${quantity}&erreur=commande`);
  }
  // Bind the tracking token to the quantity so reusing an idempotency key
  // with a different quantity is rejected by the database RPC.
  const token = createHmac("sha256", tokenSecret)
    .update(`revant-guest-order:${idempotencyKey}:${quantity}`)
    .digest("hex");
  const tokenHash = createHash("sha256").update(token).digest("hex");
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
  });

  if (error || !data?.order_number) {
    const code = error?.message.includes("product unavailable") ? "stock" : "commande";
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
