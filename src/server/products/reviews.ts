import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

export type PublishedProductReview = {
  id: string;
  rating: number;
  title: string | null;
  body: string | null;
  created_at: string;
  verifiedPurchase: boolean;
};

export async function getPublishedProductReviews(
  supabase: SupabaseClient,
  productId: string,
  offset = 0,
  limit = 10
): Promise<{ reviews: PublishedProductReview[]; total: number }> {
  const safeOffset = Math.max(0, Math.floor(offset));
  const safeLimit = Math.min(20, Math.max(1, Math.floor(limit)));

  const { data, count, error } = await supabase
    .from("reviews")
    .select("id,rating,title,body,created_at,order_id", { count: "exact" })
    .eq("product_id", productId)
    .eq("is_published", true)
    .order("created_at", { ascending: false })
    .range(safeOffset, safeOffset + safeLimit - 1);

  if (error) throw error;

  return {
    reviews: (data ?? []).map((review) => ({
      id: review.id,
      rating: review.rating,
      title: review.title,
      body: review.body,
      created_at: review.created_at,
      // The existing RLS INSERT policy requires a delivered order containing this product.
      verifiedPurchase: review.order_id !== null,
    })),
    total: count ?? 0,
  };
}
