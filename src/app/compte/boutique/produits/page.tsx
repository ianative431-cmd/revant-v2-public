import { redirect } from "next/navigation";
import Link from "next/link";
import { requireUserWithLegalConsent } from "@/server/legal/consent";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getShopByOwnerId } from "@/server/shops/shops";
import { getProductsForShop } from "@/server/products/products";
import { env } from "@/lib/env";
import ProductManageRow from "./ProductManageRow";

export default async function MesProduitsPage() {
  const user = await requireUserWithLegalConsent();
  const supabase = await createSupabaseServerClient();
  const shop = await getShopByOwnerId(supabase, user.id);

  if (!shop) {
    redirect("/boutiques/creer");
  }

  const products = await getProductsForShop(supabase, shop.id);
  const supabaseUrl = env.supabaseUrl();

  return (
    <div className="min-h-screen bg-[#F3E9DA] px-4 py-10 flex justify-center">
      <div className="w-full max-w-sm">
        <Link href="/compte/boutique" className="text-sm underline text-black/60">
          ← Ma boutique
        </Link>

        <div className="flex items-center justify-between mt-4 mb-6">
          <h1 className="text-xl font-bold">Mes annonces</h1>
          <Link
            href="/compte/boutique/produits/nouveau"
            className="bg-black text-white rounded-full px-4 py-2 text-xs font-medium"
          >
            + Ajouter
          </Link>
        </div>

        {products.length === 0 ? (
          <p className="text-sm text-black/60 text-center py-10">Aucune annonce pour l&apos;instant.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {products.map((product) => (
              <ProductManageRow key={product.id} product={product} supabaseUrl={supabaseUrl} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
