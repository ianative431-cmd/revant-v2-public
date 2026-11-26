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

export type ReviewableOrder = {
  id: string;
  delivered_at: string | null;
  created_at: string;
};

export type BuyerProductReviewStatus = {
  order_id: string;
  is_published: boolean;
  created_at: string;
};

export async function getProductReviewContext(
  supabase: SupabaseClient,
  userId: string,
  productId: string
): Promise<{
  eligibleOrders: ReviewableOrder[];
  previousReviews: BuyerProductReviewStatus[];
}> {
  const { data: deliveredOrders, error: ordersError } = await supabase
    .from("orders")
    .select("id,delivered_at,created_at")
    .eq("buyer_id", userId)
    .eq("status", "delivered")
    .order("delivered_at", { ascending: false, nullsFirst: false })
    .limit(250);

  if (ordersError) throw ordersError;
  if (!deliveredOrders?.length) {
    return { eligibleOrders: [], previousReviews: [] };
  }

  const orderIds = deliveredOrders.map((order) => order.id);
  const { data: matchingItems, error: itemsError } = await supabase
    .from("order_items")
    .select("order_id")
    .eq("product_id", productId)
    .in("order_id", orderIds);

  if (itemsError) throw itemsError;

  const eligibleOrderIds = [...new Set((matchingItems ?? []).map((item) => item.order_id))];
  if (eligibleOrderIds.length === 0) {
    return { eligibleOrders: [], previousReviews: [] };
  }

  const { data: previousReviews, error: reviewsError } = await supabase
    .from("reviews")
    .select("order_id,is_published,created_at")
    .eq("user_id", userId)
    .eq("product_id", productId)
    .in("order_id", eligibleOrderIds)
    .order("created_at", { ascending: false });

  if (reviewsError) throw reviewsError;

  const reviewedOrderIds = new Set((previousReviews ?? []).map((review) => review.order_id));
  const eligibleOrders = deliveredOrders
    .filter((order) => eligibleOrderIds.includes(order.id) && !reviewedOrderIds.has(order.id))
    .map((order) => ({
      id: order.id,
      delivered_at: order.delivered_at,
      created_at: order.created_at,
    }));

  return {
    eligibleOrders,
    previousReviews: (previousReviews ?? []).map((review) => ({
      order_id: review.order_id,
      is_published: review.is_published,
      created_at: review.created_at,
    })),
  };
}
