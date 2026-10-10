"use server";

import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type GuestOrderRpc = {
  rpc: (name: string, args: Record<string, string>) => Promise<{
    data: { order_id: string; order_number: string } | null;
    error: { message: string } | null;
  }>;
};

export async function createGuestOrder(formData: FormData): Promise<never> {
  const productId = String(formData.get("productId") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const city = String(formData.get("city") ?? "").trim();
  const address = String(formData.get("address") ?? "").trim();
  const website = String(formData.get("website") ?? "").trim();

  if (!productId || name.length < 2 || name.length > 100 || phone.length < 8 || phone.length > 24 || city.length < 2 || city.length > 100 || address.length < 5 || address.length > 300) {
    redirect(`/commande/visiteur?productId=${encodeURIComponent(productId)}&erreur=validation`);
  }

  // The database RPC also validates every field, re-reads the product price,
  // locks the product row and applies a per-phone rate limit.
  const token = randomBytes(32).toString("hex");
  const tokenHash = createHash("sha256").update(token).digest("hex");
  const supabase = await createSupabaseServerClient();
  const guestRpc = supabase as unknown as GuestOrderRpc;
  const { data, error } = await guestRpc.rpc("create_guest_order", {
    p_product_id: productId,
    p_guest_name: name,
    p_guest_phone: phone,
    p_guest_city: city,
    p_guest_address: address,
    p_tracking_token_hash: tokenHash,
    p_website: website,
  });

  if (error || !data?.order_number) {
    redirect(`/commande/visiteur?productId=${encodeURIComponent(productId)}&erreur=commande`);
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
