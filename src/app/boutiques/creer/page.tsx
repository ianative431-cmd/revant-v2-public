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
      <div className="w-full max-w-xl rounded-[26px] border border-[var(--brand-border)] bg-[var(--brand-surface)] p-5 shadow-sm sm:p-8">
        <h1 className="mb-1 text-2xl font-black tracking-tight text-[var(--brand-text)]">Créer ma boutique</h1>
        <p className="mb-6 text-sm leading-6 text-[var(--brand-muted)]">
          Ton adresse publique sera générée automatiquement à partir du nom — tu pourras la
          changer plus tard.
        </p>
        <CreateShopForm />
      </div>
    </div>
  );
}
