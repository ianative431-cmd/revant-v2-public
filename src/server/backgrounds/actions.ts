"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireUserWithLegalConsent } from "@/server/legal/consent";
import { getShopByOwnerId } from "@/server/shops/shops";

export type BackgroundSelectionState = { error: string | null };

/**
 * Choix de l'arrière-plan de la boutique — officiel OU personnel, jamais
 * les deux (contrainte shops_background_exclusive, migration 0007). On
 * revérifie ici, côté serveur, que la ressource choisie appartient bien
 * à l'utilisateur (pour un arrière-plan personnel) : jamais une
 * confiance aveugle dans l'ID envoyé par le formulaire.
 */
export async function selectShopBackground(
  _prevState: BackgroundSelectionState,
  formData: FormData
): Promise<BackgroundSelectionState> {
  const user = await requireUserWithLegalConsent();
  const supabase = await createSupabaseServerClient();

  const shop = await getShopByOwnerId(supabase, user.id);
  if (!shop) {
    return { error: "Aucune boutique associée à ce compte." };
  }

  const kind = String(formData.get("kind") ?? ""); // "official" | "personal" | "none"
  const backgroundId = String(formData.get("backgroundId") ?? "");

  if (kind === "none") {
    const { error } = await supabase
      .from("shops")
      .update({ background_id: null, personal_background_id: null })
      .eq("id", shop.id);
    if (error) return { error: "Impossible de réinitialiser l'arrière-plan." };
    redirect("/compte/boutique/personnaliser");
  }

  if (kind === "official") {
    const { data: bg } = await supabase
      .from("backgrounds")
      .select("id")
      .eq("id", backgroundId)
      .eq("is_active", true)
      .maybeSingle();
    if (!bg) return { error: "Cet arrière-plan n'est pas disponible." };

    const { error } = await supabase
      .from("shops")
      .update({ background_id: bg.id, personal_background_id: null })
      .eq("id", shop.id);
    if (error) return { error: "Impossible d'enregistrer l'arrière-plan." };
    redirect("/compte/boutique/personnaliser");
  }

  if (kind === "personal") {
    const { data: personal } = await supabase
      .from("user_backgrounds")
      .select("id")
      .eq("id", backgroundId)
      .eq("owner_id", user.id)
      .maybeSingle();
    if (!personal) return { error: "Cet arrière-plan personnel est introuvable." };

    const { error } = await supabase
      .from("shops")
      .update({ personal_background_id: personal.id, background_id: null })
      .eq("id", shop.id);
    if (error) return { error: "Impossible d'enregistrer l'arrière-plan." };
    redirect("/compte/boutique/personnaliser");
  }

  return { error: "Choix invalide." };
}
