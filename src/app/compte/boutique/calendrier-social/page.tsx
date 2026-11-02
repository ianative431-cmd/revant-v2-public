import Link from "next/link";
import { requireUserWithLegalConsent } from "@/server/legal/consent";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getShopByOwnerId } from "@/server/shops/shops";
import SocialCalendarClient from "./SocialCalendarClient";

export default async function CalendrierSocialPage() {
  const user = await requireUserWithLegalConsent();
  const supabase = await createSupabaseServerClient();
  const shop = await getShopByOwnerId(supabase, user.id);

  if (!shop) {
    return (
      <div className="min-h-screen bg-brand-bg px-4 py-10 flex justify-center">
        <div className="w-full max-w-lg rounded-2xl bg-white p-6 text-center">
          <h1 className="text-xl font-bold mb-2">Calendrier social</h1>
          <p className="text-sm text-neutral-600 mb-4">Crée d'abord ta boutique pour préparer tes publications.</p>
          <Link href="/boutiques/creer" className="inline-block rounded-full bg-brand-accent px-5 py-3 text-sm text-white">
            Créer ma boutique
          </Link>
        </div>
      </div>
    );
  }

  const { data, error } = await supabase
    .from("social_posts")
    .select("id,caption,media_url,product_url,platforms,scheduled_at,status")
    .eq("shop_id", shop.id)
    .eq("owner_id", user.id)
    .order("scheduled_at", { ascending: true });

  if (error) {
    throw new Error("Impossible de charger le calendrier social.");
  }

  return (
    <main className="min-h-screen bg-brand-bg px-4 py-8">
      <div className="mx-auto w-full max-w-2xl">
        <Link href="/compte/boutique" className="text-sm text-neutral-500 underline">
          ← Ma boutique
        </Link>
        <h1 className="mt-4 text-2xl font-bold">Calendrier social</h1>
        <p className="mb-6 mt-1 text-sm text-neutral-600">
          Prépare tes messages et organise les dates de partage de ta boutique.
        </p>
        <SocialCalendarClient
          shopId={shop.id}
          ownerId={user.id}
          initialPosts={(data ?? []) as {
            id: string;
            caption: string;
            media_url: string | null;
            product_url: string | null;
            platforms: string[];
            scheduled_at: string;
            status: string;
          }[]}
        />
      </div>
    </main>
  );
}
