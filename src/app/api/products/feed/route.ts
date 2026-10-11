import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getActiveProducts } from "@/server/products/products";
import { getActiveCategories } from "@/server/catalog/categories";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const offset = Number(params.get("offset") ?? "0");
  const requestedLimit = Number(params.get("limit") ?? "24");
  if (!Number.isInteger(offset) || offset < 0 || offset > 1000000) {
    return NextResponse.json({ error: "Offset invalide." }, { status: 400 });
  }
  const limit = Number.isInteger(requestedLimit) ? Math.min(48, Math.max(1, requestedLimit)) : 24;
  try {
    const supabase = await createSupabaseServerClient();
    const categories = await getActiveCategories(supabase);
    const categorySlug = params.get("categorie") ?? "";
    const category = categories.find((item) => item.slug === categorySlug);
    if (categorySlug && !category) {
      return NextResponse.json({ products: [], hasMore: false });
    }
    const searchTerm = (params.get("q") ?? "").trim().slice(0, 100);
    const page = await getActiveProducts(supabase, {
      categoryId: category?.id,
      limit: limit + 1,
      offset,
      searchTerm: searchTerm || undefined,
    });
    const hasMore = page.length > limit;
    return NextResponse.json(
      { products: page.slice(0, limit), hasMore },
      { headers: { "Cache-Control": "private, no-store" } }
    );
  } catch {
    return NextResponse.json({ error: "Le catalogue est temporairement indisponible." }, { status: 503 });
  }
}
