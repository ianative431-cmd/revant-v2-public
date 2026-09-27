import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUserWithLegalConsent } from "@/server/legal/consent";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getShopByOwnerId } from "@/server/shops/shops";
import { getPalettesForShopType } from "@/content/shops/color-palettes";
import { getActiveBackgrounds, getUserBackgrounds } from "@/server/backgrounds/backgrounds";
import { env } from "@/lib/env";
import PaletteCard from "./PaletteCard";
import BackgroundSection from "./BackgroundSection";

export default async function PersonnaliserBoutiquePage() {
  const user = await requireUserWithLegalConsent();
  const supabase = await createSupabaseServerClient();
  const shop = await getShopByOwnerId(supabase, user.id);

  if (!shop) {
    redirect("/boutiques/creer");
  }

  const palettes = getPalettesForShopType(shop.shop_type);
  const officialBackgrounds = await getActiveBackgrounds(supabase);
  const personalBackgrounds = await getUserBackgrounds(supabase, user.id);
  const supabaseUrl = env.supabaseUrl();

  return (
    <div className="min-h-screen bg-[#F3E9DA] px-4 py-10 flex justify-center">
      <div className="w-full max-w-sm">
        <Link href="/compte/boutique" className="text-sm underline text-black/60">
          ← Ma boutique
        </Link>

        <h1 className="text-xl font-bold mt-4 mb-1">Personnaliser {shop.name}</h1>
        <p className="text-sm text-black/60 mb-6">
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

        <BackgroundSection
          officialBackgrounds={officialBackgrounds}
          personalBackgrounds={personalBackgrounds}
          currentBackgroundId={shop.background_id}
          currentPersonalBackgroundId={shop.personal_background_id}
          supabaseUrl={supabaseUrl}
        />

        <div className="bg-white rounded-2xl p-4 mt-6">
          <p className="text-xs font-semibold text-black/60 mb-3">Bientôt disponible</p>
          <div className="flex flex-col gap-2">
            {["Logo et bannière", "Sections de la boutique", "Typographie"].map((label) => (
              <button
                key={label}
                type="button"
                disabled
                className="text-left text-sm text-black/40 border border-black/10 rounded-xl px-4 py-3 cursor-not-allowed"
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
