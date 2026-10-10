"use server";

import { createHash, randomBytes } from "node:crypto";
import { redirect } from "next/navigation";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

function clean(value: FormDataEntryValue | null, max: number): string {
  return String(value ?? "").trim().slice(0, max);
}

function checkoutError(code: string, productId: string): never {
  redirect(`/commande/visiteur?productId=${encodeURIComponent(productId)}&error=${encodeURIComponent(code)}`);
}

/**
 * Guest checkout is performed server-side with a service-role client.
 * No public INSERT policy is added to orders/order_items. All product data
 * and prices are re-read from the database; submitted prices are ignored.
 */
export async function createGuestOrder(formData: FormData): Promise<void> {
  const productId = clean(formData.get("productId"), 80);
  const name = clean(formData.get("name"), 120);
  const phone = clean(formData.get("phone"), 30);
  const city = clean(formData.get("city"), 120);
  const address = clean(formData.get("address"), 500);
  const honeypot = clean(formData.get("website"), 200);

  if (!productId) checkoutError("produit", "");
  if (honeypot) redirect("/"); // silent bot trap
  if (name.length < 2 || !/^[+0-9()\s.-]{7,30}$/.test(phone) ||
      city.length < 2 || address.length < 3) {
    checkoutError("coordonnees", productId);
  }

  const db = createSupabaseAdminClient() as any;
  const { data: product, error: productError } = await db
    .from("products")
    .select("id, name, base_price, currency, status, stock_quantity, shop_id")
    .eq("id", productId)
    .maybeSingle();

  if (productError || !product || product.status !== "active" || product.stock_quantity < 1) {
    checkoutError("indisponible", productId);
  }

  const { data: shop } = await db
    .from("shops")
    .select("id, name, owner_id, status")
    .eq("id", product.shop_id)
    .maybeSingle();

  if (!shop || shop.status !== "active") checkoutError("indisponible", productId);

  const token = randomBytes(32).toString("base64url");
  const tokenHash = createHash("sha256").update(token).digest("hex");
  const orderNumber = `RVT-${Date.now().toString(36).toUpperCase()}-${randomBytes(4).toString("hex").toUpperCase()}`;
  const now = new Date().toISOString();

  const { data: order, error: orderError } = await db
    .from("orders")
    .insert({
      buyer_id: null,
      guest_name: name,
      guest_phone: phone,
      delivery_city: city,
      delivery_address: address,
      guest_access_token_hash: tokenHash,
      order_number: orderNumber,
      status: "pending",
      currency: product.currency,
      subtotal: product.base_price,
      delivery_fee: 0,
      total_amount: product.base_price,
      placed_at: now,
    })
    .select("id")
    .single();

  if (orderError || !order) checkoutError("erreur", productId);

  const { error: itemError } = await db.from("order_items").insert({
    order_id: order.id,
    product_id: product.id,
    shop_id: product.shop_id,
    product_name: product.name,
    quantity: 1,
    unit_price: product.base_price,
    line_total: product.base_price,
    currency: product.currency,
  });

  if (itemError) {
    await db.from("orders").delete().eq("id", order.id);
    checkoutError("erreur", productId);
  }

  redirect(`/commande/confirmation?token=${encodeURIComponent(token)}`);
}
