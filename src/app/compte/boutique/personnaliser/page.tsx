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

        <ShopMediaForm
          shopId={shop.id}
          ownerId={user.id}
          initialLogoUrl={shop.logo_url}
          initialBannerUrl={shop.banner_url}
        />

        <div className="flex flex-col gap-4 mb-8">
          {palettes.map((palette) => (
            <PaletteCard
              key={palette.id}
              palette={palette}
              selected={shop.background_color === palette.id}
            />
          ))}
        </div>

        <p className="mt-6 text-xs text-brand-text/50">
          Les images sont optimisées avant envoi et restent modifiables depuis cet espace.
        </p>
      </div>
    </div>
  );
}
