import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Product } from "@/types/product";

export type AdminProductRow = Product & { shop: { name: string; slug: string } | null };

/**
 * Tous les produits, toutes boutiques confondues, pour la modération
 * admin. products_public_read autorise déjà cette lecture (using(true),
 * voir migration 0004_products.sql) — pas besoin de service role ici,
 * contrairement aux boutiques/comptes.
 */
export async function getAllProductsForAdmin(
  supabase: SupabaseClient,
  limit = 200
): Promise<AdminProductRow[]> {
  const { data } = await supabase
    .from("products")
    .select("*, shop:shops(name, slug)")
    .order("created_at", { ascending: false })
    .limit(limit);

  return (data ?? []) as unknown as AdminProductRow[];
}
