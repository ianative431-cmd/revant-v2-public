import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Product } from "@/types/product";

export async function getActiveProducts(
  supabase: SupabaseClient,
  options?: { category?: string; limit?: number }
): Promise<Product[]> {
  let query = supabase
    .from("products")
    .select("*")
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(options?.limit ?? 24);

  if (options?.category) {
    query = query.eq("category", options.category);
  }

  const { data } = await query;
  return (data ?? []) as Product[];
}

export async function getProductsForShop(
  supabase: SupabaseClient,
  shopId: string
): Promise<Product[]> {
  const { data } = await supabase
    .from("products")
    .select("*")
    .eq("shop_id", shopId)
    .order("created_at", { ascending: false });

  return (data ?? []) as Product[];
}

export async function getProductById(
  supabase: SupabaseClient,
  id: string
): Promise<Product | null> {
  const { data } = await supabase.from("products").select("*").eq("id", id).maybeSingle();
  return (data as Product) ?? null;
}
