"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireUser } from "@/server/auth/session";
import { getRequiredConsentVersions } from "@/server/legal/consent";

export type ReconsentState = { error: string | null };

export async function acceptUpdatedLegalDocuments(
  _prevState: ReconsentState,
  formData: FormData
): Promise<ReconsentState> {
  // Vérification serveur systématique : on ne fait jamais confiance à
  // l'état d'une case à cocher côté client.
  await requireUser();

  const accepted = formData.get("acceptUpdated") === "on";
  if (!accepted) {
    return { error: "Tu dois accepter les documents mis à jour pour continuer." };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.updateUser({
    data: {
      legal_consent: {
        versions: getRequiredConsentVersions(),
        consentedAt: new Date().toISOString(),
        consentType: "reconsentement" as const,
      },
    },
  });

  if (error) {
    return { error: "Impossible d'enregistrer ton accord pour le moment. Réessaie." };
  }

  redirect("/compte");
}
