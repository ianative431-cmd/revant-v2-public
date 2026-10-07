import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getAllProductsForAdmin } from "@/server/admin/products-admin";
import DeleteProductButton from "./DeleteProductButton";

export default async function AdminProduitsPage() {
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
            <div key={p.id} className="bg-white rounded-2xl p-4 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{p.name}</p>
                <p className="text-xs text-black/50 mt-0.5">
                  {p.shop?.name ?? "Boutique supprimée"}
                  {p.categoryName ? ` · ${p.categoryName}` : ""} ·{" "}
                  {p.base_price.toLocaleString("fr-FR")} {p.currency} · {p.status}
                </p>
              </div>
              <div className="shrink-0 flex items-center gap-2">
                <Link href={`/produit/${p.id}`} className="text-xs underline text-black/50">
                  Voir
                </Link>
                <DeleteProductButton productId={p.id} imageUrls={p.images} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
