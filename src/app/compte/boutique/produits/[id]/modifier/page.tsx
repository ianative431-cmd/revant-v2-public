import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireUserWithLegalConsent } from "@/server/legal/consent";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getShopByOwnerId } from "@/server/shops/shops";
import { getProductById } from "@/server/products/products";
import { getActiveCategories } from "@/server/catalog/categories";
import EditProductForm from "./EditProductForm";

export default async function ModifierProduitPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUserWithLegalConsent();
  const supabase = await createSupabaseServerClient();
  const shop = await getShopByOwnerId(supabase, user.id);

  if (!shop) redirect("/boutiques/creer");

  const product = await getProductById(supabase, id);
  if (!product || product.shop_id !== shop.id) notFound();

  const [{ data: imageRows, error: imageError }, categories] = await Promise.all([
    supabase
      .from("product_images")
      .select("id, image_url, sort_order")
      .eq("product_id", product.id)
      .order("sort_order", { ascending: true }),
    getActiveCategories(supabase),
  ]);

  if (imageError) throw imageError;

  return (
    <main className="min-h-screen bg-brand-bg px-4 py-10">
      <div className="mx-auto w-full max-w-3xl rounded-[26px] border border-[var(--brand-border)] bg-[var(--brand-surface)] p-5 shadow-sm sm:p-8">
        <Link href="/compte/boutique/produits" className="text-sm text-brand-text/65 underline">
          ← Mes annonces
        </Link>
        <h1 className="mb-2 mt-5 text-2xl font-black tracking-tight text-brand-text">Modifier l'annonce</h1>
        <p className="mb-6 text-sm text-[var(--brand-muted)]">Les changements sont enregistrés sur cette annonce uniquement.</p>
        <EditProductForm
          product={product}
          shopId={shop.id}
          initialImages={imageRows ?? []}
          categories={categories}
        />
      </div>
    </main>
  );
}
