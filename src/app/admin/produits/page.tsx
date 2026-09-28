import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getAllProductsForAdmin } from "@/server/admin/products-admin";
import { getCategoryLabel } from "@/content/products/categories";
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
                <p className="text-sm font-medium truncate">{p.title}</p>
                <p className="text-xs text-black/50 mt-0.5">
                  {p.shop?.name ?? "Boutique supprimée"} · {getCategoryLabel(p.category)} ·{" "}
                  {p.price_fcfa.toLocaleString("fr-FR")} FCFA ·{" "}
                  {p.status === "sold" ? "Vendu" : "Actif"}
                </p>
              </div>
              <div className="shrink-0 flex items-center gap-2">
                <Link href={`/produit/${p.id}`} className="text-xs underline text-black/50">
                  Voir
                </Link>
                <DeleteProductButton productId={p.id} imagePath={p.image_path} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
