import { notFound, permanentRedirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { resolveShopBySlug } from "@/server/shops/shops";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const supabase = await createSupabaseServerClient();
  const result = await resolveShopBySlug(supabase, slug);

  if (result.kind !== "found") {
    return { title: "Boutique — Revant" };
  }
  return {
    title: `${result.shop.name} — Revant`,
    description: result.shop.slogan ?? result.shop.description ?? undefined,
  };
}

const SHOP_TYPE_LABEL: Record<string, string> = {
  pro: "Boutique Pro",
  fournisseur: "Fournisseur",
};

export default async function ShopPublicPage({ params }: Props) {
  const { slug } = await params;
  const supabase = await createSupabaseServerClient();
  const result = await resolveShopBySlug(supabase, slug);

  if (result.kind === "not_found") {
    notFound();
  }

  if (result.kind === "redirect") {
    // Ancien lien de boutique : redirection permanente vers la nouvelle
    // adresse (section 7 du prompt maître), le Revant ID de la boutique
    // n'a jamais changé.
    permanentRedirect(`/shop/${result.toSlug}`);
  }

  const { shop } = result;
  const typeLabel = SHOP_TYPE_LABEL[shop.shop_type];

  return (
    <div className="min-h-screen bg-[#F3E9DA] px-4 py-10">
      <div className="max-w-2xl mx-auto bg-white rounded-[22px] p-8">
        <div className="flex items-center gap-2 mb-2">
          <h1 className="text-2xl font-bold">{shop.name}</h1>
          {typeLabel && (
            <span className="text-xs font-medium bg-black/5 rounded-full px-2 py-1">
              {typeLabel}
            </span>
          )}
        </div>

        {shop.slogan && <p className="text-sm text-black/60 mb-4">{shop.slogan}</p>}

        {shop.description && (
          <p className="text-sm text-black/80 mb-6 whitespace-pre-line">{shop.description}</p>
        )}

        <div className="border-t pt-6">
          <h2 className="text-sm font-semibold text-black/60 mb-2">Produits</h2>
          {/* Le catalogue produits n'est pas encore construit — voir
              revant_etat_reel_et_plan.md, Étape 4. Un état vide honnête
              plutôt qu'une fausse liste (section 3/48 du prompt maître). */}
          <p className="text-sm text-black/40">Aucun produit pour l&apos;instant.</p>
        </div>
      </div>
    </div>
  );
}
