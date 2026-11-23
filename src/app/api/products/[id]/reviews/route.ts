import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getPublishedProductReviews } from "@/server/products/reviews";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  if (!UUID_PATTERN.test(id)) {
    return NextResponse.json({ error: "Référence produit invalide." }, { status: 400 });
  }

  const { searchParams } = new URL(request.url);
  const rawOffset = Number(searchParams.get("offset") ?? 0);
  const offset = Number.isFinite(rawOffset) ? Math.max(0, Math.floor(rawOffset)) : 0;
  const rawLimit = Number(searchParams.get("limit") ?? 10);
  const limit = Number.isFinite(rawLimit) ? Math.min(20, Math.max(1, Math.floor(rawLimit))) : 10;

  try {
    const supabase = await createSupabaseServerClient();
    const result = await getPublishedProductReviews(supabase, id, offset, limit);
    return NextResponse.json(
      {
        reviews: result.reviews,
        total: result.total,
        hasMore: offset + result.reviews.length < result.total,
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("GET /api/products/[id]/reviews failed", error);
    return NextResponse.json(
      { error: "Impossible de charger les avis pour le moment." },
      { status: 503 },
    );
  }
}
