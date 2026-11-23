import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getActiveCategories } from "@/server/catalog/categories";
import { getActiveProducts } from "@/server/products/products";

const PAGE_SIZE = 24;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

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
  const rawExcludeIds = (searchParams.get("excludeIds") ?? "").split(",").filter(Boolean);
  if (rawExcludeIds.length > 32 || rawExcludeIds.some((id) => !UUID_PATTERN.test(id))) {
    return NextResponse.json({ error: "Paramètres de recommandation invalides." }, { status: 400 });
  }
  const excludeIds = [...new Set(rawExcludeIds)];
  const inStockOnly = searchParams.get("stock") === "1";

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
      inStockOnly,
      excludeIds,
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
