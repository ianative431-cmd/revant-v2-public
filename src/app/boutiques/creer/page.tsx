import { redirect } from "next/navigation";
import { requireUserWithLegalConsent } from "@/server/legal/consent";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getShopByOwnerId } from "@/server/shops/shops";
import CreateShopForm from "./CreateShopForm";

export default async function CreerBoutiquePage() {
  const user = await requireUserWithLegalConsent();
  const supabase = await createSupabaseServerClient();

  const existing = await getShopByOwnerId(supabase, user.id);
  if (existing) {
    // Un seul compte = une seule boutique pour l'instant.
    redirect("/compte/boutique");
  }

  return (
    <div className="min-h-screen bg-brand-bg px-4 py-10 flex justify-center">
      <div className="w-full max-w-sm bg-white rounded-[22px] p-8 shadow-sm">
        <h1 className="text-xl font-bold mb-1">Créer ma boutique</h1>
        <p className="text-sm text-brand-text/60 mb-6">
          Ton adresse publique sera générée automatiquement à partir du nom — tu pourras la
          changer plus tard.
        </p>
        <CreateShopForm />
      </div>
    </div>
  );
}
