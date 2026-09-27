import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getActiveRestaurants } from "@/server/shops/shops";

export const metadata = {
  title: "Restaurants — Revant",
};

export default async function RestaurantsPage() {
  const supabase = await createSupabaseServerClient();
  const restaurants = await getActiveRestaurants(supabase);

  return (
    <div className="min-h-screen bg-[#F3E9DA]">
      <header className="px-4 pt-6 pb-4 flex items-center justify-between">
        <Link href="/" className="text-sm underline text-black/60">
          ← Accueil
        </Link>
        <span className="text-sm font-medium">Restaurants</span>
      </header>

      <main className="px-4 pb-16">
        {restaurants.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-sm text-black/60 mb-4">
              Aucun restaurant sur Revant pour l&apos;instant.
            </p>
            <Link
              href="/boutiques/creer"
              className="inline-block bg-black text-white rounded-full px-6 py-3 text-sm font-medium"
            >
              Ouvrir mon restaurant sur Revant
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {restaurants.map((shop) => (
              <Link
                key={shop.id}
                href={`/shop/${shop.slug}`}
                className="block bg-white rounded-2xl p-4"
              >
                <p className="text-sm font-semibold">{shop.name}</p>
                {shop.slogan && (
                  <p className="text-xs text-black/60 mt-0.5">{shop.slogan}</p>
                )}
                {shop.description && (
                  <p className="text-xs text-black/40 mt-1 line-clamp-2">{shop.description}</p>
                )}
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
