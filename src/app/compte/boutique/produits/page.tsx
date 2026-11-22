import { redirect } from "next/navigation";
import Link from "next/link";
import { requireUserWithLegalConsent } from "@/server/legal/consent";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getShopByOwnerId } from "@/server/shops/shops";
import { getProductsForShop } from "@/server/products/products";
import ProductManageRow from "./ProductManageRow";

export default async function MesProduitsPage() {
  const user = await requireUserWithLegalConsent();
  const supabase = await createSupabaseServerClient();
  const shop = await getShopByOwnerId(supabase, user.id);

  if (!shop) {
    redirect("/boutiques/creer");
  }

  const products = await getProductsForShop(supabase, shop.id);

  return (
    <div className="revant-seller-products min-h-screen bg-brand-bg px-4 py-10 flex justify-center">
      <div className="revant-seller-products-layout w-full max-w-6xl">
        <Link href="/compte/boutique" className="text-sm underline text-brand-text/60">
          ← Ma boutique
        </Link>

        <div className="flex items-center justify-between mt-4 mb-6">
          <h1 className="text-2xl font-black tracking-tight">Mes annonces</h1>
          <Link
            href="/compte/boutique/produits/nouveau"
            className="bg-brand-accent text-white rounded-full px-4 py-2 text-xs font-medium"
          >
            + Ajouter
          </Link>
        </div>

        {products.length === 0 ? (
          <p className="text-sm text-brand-text/60 text-center py-10">Aucune annonce pour l&apos;instant.</p>
        ) : (
          <div className="revant-seller-product-grid grid grid-cols-1 gap-3 lg:grid-cols-2">
            {products.map((product) => (
              <ProductManageRow key={product.id} product={product} shopStatus={shop.status} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
