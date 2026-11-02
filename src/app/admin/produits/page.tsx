import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getAllProductsForAdmin } from "@/server/admin/products-admin";
import DeleteProductButton from "./DeleteProductButton";
import ProductModerationActions from "./ProductModerationActions";
import { requirePermission } from "@/server/auth/roles";

export default async function AdminProduitsPage() {
  await requirePermission("products.view");
  const supabase = await createSupabaseServerClient();
  const products = await getAllProductsForAdmin(supabase);

  return (
    <div>
      <h1 className="text-xl font-bold mb-1">Produits</h1>
      <p className="text-sm text-black/60 mb-6">
        {products.length} annonce{products.length > 1 ? "s" : ""}, toutes boutiques confondues
        (200 plus récentes).
      </p>

      {products.length === 0 ? (
        <p className="text-sm text-black/40 bg-white rounded-2xl p-6 text-center">
          Aucun produit pour l&apos;instant.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {products.map((p) => (
            <div key={p.id} className="flex flex-col gap-3 rounded-2xl bg-white p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{p.name}</p>
                  <p className="mt-0.5 text-xs text-black/50">
                    {p.shop?.name ?? "Boutique supprimée"}
                    {p.categoryName ? ` · ${p.categoryName}` : ""} ·{" "}
                    {p.base_price.toLocaleString("fr-FR")} {p.currency} · {p.status}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Link href={`/produit/${p.id}`} className="text-xs text-black/50 underline">
                    Voir
                  </Link>
                  <DeleteProductButton productId={p.id} imageUrls={p.images} />
                </div>
              </div>
              {p.status === "pending" && <ProductModerationActions productId={p.id} />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
