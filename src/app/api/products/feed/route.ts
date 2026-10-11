import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getActiveCategories } from "@/server/catalog/categories";
import { getActiveProducts } from "@/server/products/products";

const PAGE_SIZE = 24;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const rawOffset = Number(searchParams.get("offset") ?? 0);
  const offset = Number.isFinite(rawOffset) ? Math.max(0, Math.floor(rawOffset)) : 0;
  const rawLimit = Number(searchParams.get("limit") ?? PAGE_SIZE);
  const limit = Number.isFinite(rawLimit)
    ? Math.min(PAGE_SIZE, Math.max(1, Math.floor(rawLimit)))
    : PAGE_SIZE;
  const categorySlug = (searchParams.get("categorie") ?? searchParams.get("categories") ?? "").trim();
  const searchTerm = (searchParams.get("q") ?? "").trim();

  try {
    const supabase = await createSupabaseServerClient();
    let categoryId: string | undefined;
    let productType: "clothing" | "perfume" | undefined;

    if (categorySlug === "mode") productType = "clothing";
    else if (categorySlug === "parfums") productType = "perfume";
    else if (categorySlug) {
      const categories = await getActiveCategories(supabase);
      const category = categories.find((item) => item.slug === categorySlug);
      if (!category) {
        return NextResponse.json({ products: [], hasMore: false });
      }
      categoryId = category.id;
    }

    const products = await getActiveProducts(supabase, {
      categoryId,
      productType,
      offset,
      limit,
      searchTerm: searchTerm || undefined,
    });

    return NextResponse.json(
      { products, hasMore: products.length === limit },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("GET /api/products/feed failed", error);
    return NextResponse.json(
      { error: "Impossible de charger les produits pour le moment." },
      { status: 503 },
    );
  }
}
