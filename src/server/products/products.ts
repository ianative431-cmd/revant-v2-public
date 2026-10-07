import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Product } from "@/types/product";

const PRODUCT_SELECT =
  "id, shop_id, name, description, base_price, currency, stock_quantity, status, slug, category_id, created_at, updated_at, categories(name), product_images(image_url, sort_order)";

type ProductRow = {
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
};

function mapRow(row: ProductRow): Product {
  const images = [...(row.product_images ?? [])]
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((img) => img.image_url);

  return {
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
    images,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export async function getActiveProducts(
  supabase: SupabaseClient,
  options?: { categoryId?: string; limit?: number }
): Promise<Product[]> {
  let query = supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(options?.limit ?? 24);

  if (options?.categoryId) {
    query = query.eq("category_id", options.categoryId);
  }

  const { data } = await query.returns<ProductRow[]>();
  return (data ?? []).map(mapRow);
}

export async function getProductsForShop(
  supabase: SupabaseClient,
  shopId: string
): Promise<Product[]> {
  const { data } = await supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .eq("shop_id", shopId)
    .order("created_at", { ascending: false })
    .returns<ProductRow[]>();

  return (data ?? []).map(mapRow);
}

export async function getProductById(
  supabase: SupabaseClient,
  id: string
): Promise<Product | null> {
  const { data } = await supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .eq("id", id)
    .maybeSingle()
    .returns<ProductRow>();

  return data ? mapRow(data) : null;
}
