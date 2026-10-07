import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Product } from "@/types/product";

export type AdminProductRow = Product & { shop: { name: string; slug: string } | null };

type RawRow = {
  id: string;
  shop_id: string;
  name: string;
  description: string | null;
  base_price: number;
  currency: string;
  stock_quantity: number;
  status: Product["status"];
  slug: string;
  category_id: string | null;
  created_at: string;
  updated_at: string;
  categories: { name: string } | null;
  product_images: { image_url: string; sort_order: number }[] | null;
  shop: { name: string; slug: string } | null;
};

/**
 * Tous les produits, toutes boutiques confondues, pour la modération
 * admin. products_public_read autorise déjà cette lecture (using(true)) —
 * pas besoin de service role ici, contrairement aux boutiques/comptes.
 */
export async function getAllProductsForAdmin(
  supabase: SupabaseClient,
  limit = 200
): Promise<AdminProductRow[]> {
  const { data } = await supabase
    .from("products")
    .select(
      `id, shop_id, name, description, base_price, currency, stock_quantity, status, slug,
       category_id, created_at, updated_at,
       categories ( name ),
       product_images ( image_url, sort_order ),
       shop:shops ( name, slug )`
    )
    .order("created_at", { ascending: false })
    .limit(limit);

  return ((data ?? []) as unknown as RawRow[]).map((row) => ({
    id: row.id,
    shop_id: row.shop_id,
    name: row.name,
    description: row.description,
    base_price: row.base_price,
    currency: row.currency,
    stock_quantity: row.stock_quantity,
    status: row.status,
    slug: row.slug,
    category_id: row.category_id,
    categoryName: row.categories?.name ?? null,
    images: (row.product_images ?? [])
      .slice()
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((img) => img.image_url),
    created_at: row.created_at,
    updated_at: row.updated_at,
    shop: row.shop,
  }));
}
