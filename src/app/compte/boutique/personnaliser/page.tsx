import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUserWithLegalConsent } from "@/server/legal/consent";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getShopByOwnerId } from "@/server/shops/shops";
import { getPalettesForShopType } from "@/content/shops/color-palettes";
import PaletteCard from "./PaletteCard";

export default async function PersonnaliserBoutiquePage() {
  const user = await requireUserWithLegalConsent();
  const supabase = await createSupabaseServerClient();
  const shop = await getShopByOwnerId(supabase, user.id);

  if (!shop) {
    redirect("/boutiques/creer");
  }

  const palettes = getPalettesForShopType(shop.shop_type);

  return (
    <div className="min-h-screen bg-[#EFEFED] px-4 py-10 flex justify-center">
      <div className="w-full max-w-sm">
        <Link href="/compte/boutique" className="text-sm underline text-neutral-500">
          ← Ma boutique
        </Link>

        <h1 className="text-xl font-bold mt-4 mb-1">Personnaliser {shop.name}</h1>
        <p className="text-sm text-neutral-500 mb-6">
          Choisis une palette de couleurs pour ta boutique publique.
        </p>

        <div className="flex flex-col gap-4 mb-8">
          {palettes.map((palette) => (
            <PaletteCard
              key={palette.id}
              palette={palette}
              selected={shop.color_palette_id === palette.id}
            />
          ))}
        </div>

        <div className="bg-white rounded-2xl p-4">
          <p className="text-xs font-semibold text-neutral-500 mb-3">Bientôt disponible</p>
          <div className="flex flex-col gap-2">
            {["Logo et bannière", "Arrière-plan", "Sections de la boutique", "Typographie"].map(
              (label) => (
                <button
                  key={label}
                  type="button"
                  disabled
                  className="text-left text-sm text-neutral-400 border border-neutral-200 rounded-xl px-4 py-3 cursor-not-allowed"
                >
                  {label}
                </button>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
