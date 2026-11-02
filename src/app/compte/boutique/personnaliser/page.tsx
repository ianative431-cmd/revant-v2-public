import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUserWithLegalConsent } from "@/server/legal/consent";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getShopByOwnerId } from "@/server/shops/shops";
import { getPalettesForShopType } from "@/content/shops/color-palettes";
import PaletteCard from "./PaletteCard";
import ShopMediaForm from "./ShopMediaForm";

export default async function PersonnaliserBoutiquePage() {
  const user = await requireUserWithLegalConsent();
  const supabase = await createSupabaseServerClient();
  const shop = await getShopByOwnerId(supabase, user.id);

  if (!shop) {
    redirect("/boutiques/creer");
  }

  const palettes = getPalettesForShopType(shop);

  return (
    <div className="min-h-screen bg-brand-bg px-4 py-10 flex justify-center">
      <div className="w-full max-w-sm">
        <Link href="/compte/boutique" className="text-sm underline text-brand-text/60">
          ← Ma boutique
        </Link>

        <h1 className="text-xl font-bold mt-4 mb-1">Personnaliser {shop.name}</h1>
        <p className="text-sm text-brand-text/60 mb-6">
          Choisis une palette de couleurs pour ta boutique publique.
        </p>

        <div className="flex flex-col gap-4 mb-8">
          {palettes.map((palette) => (
            <PaletteCard
              key={palette.id}
              palette={palette}
              selected={shop.background_color === palette.id}
            />
          ))}
        </div>

        <ShopMediaForm
          shopId={shop.id}
          userId={user.id}
          logoUrl={shop.logo_url}
          bannerUrl={shop.banner_url}
        />
        <div className="bg-white/70 rounded-2xl p-4 mt-4">
          <p className="text-xs font-semibold text-brand-text/60 mb-1">Autres options</p>
          <p className="text-xs text-brand-text/50">L'image d'arrière-plan personnalisée et la typographie seront ajoutées dans un prochain lot.</p>
        </div>
      </div>
    </div>
  );
}
