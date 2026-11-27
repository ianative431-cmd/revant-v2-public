import Link from "next/link";
import { getAllProductsForAdmin } from "@/server/admin/products-admin";
import DeleteProductButton from "./DeleteProductButton";
import ProductModerationActions from "./ProductModerationActions";
import { hasPermission, requirePermission } from "@/server/auth/roles";

export default async function AdminProduitsPage() {
  await requirePermission("products.view");
  const [products, canManageProducts] = await Promise.all([
    getAllProductsForAdmin(),
    hasPermission("products.manage"),
  ]);

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
            <div key={p.id} className="bg-white rounded-2xl p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{p.name}</p>
                <p className="text-xs text-black/50 mt-0.5">
                  {p.shop?.name ?? "Boutique supprimée"}
                  {p.categoryName ? ` · ${p.categoryName}` : ""} ·{" "}
                  {p.base_price.toLocaleString("fr-FR")} {p.currency} · {p.status}
                </p>
                {p.shop && (
                  <p className="mt-1 text-[10px] text-black/40">
                    Boutique : {p.shop.status === "active" ? "publiée" : p.shop.status === "pending" ? "en validation" : p.shop.status === "suspended" ? "suspendue" : p.shop.status === "closed" ? "fermée" : "brouillon"}
                  </p>
                )}
              </div>
              <div className="flex min-w-0 flex-wrap items-center justify-end gap-2">
                <Link href={`/produit/${p.id}`} className="text-xs underline text-black/50">
                  Voir
                </Link>
                {canManageProducts && (
                  <>
                    <ProductModerationActions
                      productId={p.id}
                      status={p.status}
                      shopActive={p.shop?.status === "active"}
                    />
                    <DeleteProductButton productId={p.id} imageUrls={p.images} />
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
