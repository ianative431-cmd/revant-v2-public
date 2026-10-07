import { redirect } from "next/navigation";
import Link from "next/link";
import { requireUserWithLegalConsent } from "@/server/legal/consent";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getShopByOwnerId } from "@/server/shops/shops";
import { getActiveCategories } from "@/server/catalog/categories";
import NewProductForm from "./NewProductForm";

export default async function NouveauProduitPage() {
  const user = await requireUserWithLegalConsent();
  const supabase = await createSupabaseServerClient();
  const shop = await getShopByOwnerId(supabase, user.id);

  if (!shop) {
    redirect("/boutiques/creer");
  }

  const categories = await getActiveCategories(supabase);

  return (
    <div className="min-h-screen bg-[#F3E9DA] px-4 py-10 flex justify-center">
      <div className="w-full max-w-sm bg-white rounded-[22px] p-8">
        <Link href="/compte/boutique/produits" className="text-sm underline text-black/60">
          ← Mes annonces
        </Link>
        <h1 className="text-xl font-bold mt-4 mb-6">Nouvelle annonce</h1>
        <NewProductForm shopId={shop.id} categories={categories} />
      </div>
    </div>
  );
}
