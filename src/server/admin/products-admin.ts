import "server-only";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { Product } from "@/types/product";

export type AdminProductRow = Product & {
  shop: { name: string; slug: string; status: string } | null;
};

type RawRow = {
  id: string;
  shop_id: string;
  name: string;
  description: string | null;
  base_price: number;
  currency: string;
  stock_quantity: number;
  product_type: Product["product_type"];
  size_stock: Product["size_stock"];
  perfume_volume_ml: Product["perfume_volume_ml"];
  status: Product["status"];
  slug: string;
  category_id: string | null;
  created_at: string;
  updated_at: string;
  categories: { name: string } | null;
  product_images: { image_url: string; sort_order: number }[] | null;
  shop: { name: string; slug: string; status: string } | null;
};

/**
 * Vue complète de modération, y compris le statut des boutiques non publiques.
 * Cette fonction server-only est appelée après requirePermission("products.view").
 */
export async function getAllProductsForAdmin(limit = 200): Promise<AdminProductRow[]> {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("products")
    .select(
      `id, shop_id, name, description, base_price, currency, stock_quantity, product_type, size_stock, perfume_volume_ml, status, slug,
       category_id, created_at, updated_at,
       categories ( name ),
       product_images ( image_url, sort_order ),
       shop:shops ( name, slug, status )`
    )
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error("Impossible de charger les annonces pour la modération.");

  return ((data ?? []) as unknown as RawRow[]).map((row) => ({
    id: row.id,
    shop_id: row.shop_id,
    name: row.name,
    description: row.description,
    base_price: row.base_price,
    currency: row.currency,
    stock_quantity: row.stock_quantity,
    product_type: row.product_type,
    size_stock: row.size_stock,
    perfume_volume_ml: row.perfume_volume_ml,
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
