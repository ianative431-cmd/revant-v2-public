"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireUserWithLegalConsent } from "@/server/legal/consent";

export type CreateDisputeState = { error: string | null; success?: boolean };

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function createDisputeAction(_previousState: CreateDisputeState, formData: FormData): Promise<CreateDisputeState> {
  const user = await requireUserWithLegalConsent();
  const orderId = String(formData.get("orderId") ?? "").trim();
  const reason = String(formData.get("reason") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();

  if (!UUID_RE.test(orderId)) return { error: "Référence de commande invalide." };
  if (reason.length < 3 || reason.length > 120) return { error: "Le motif doit contenir entre 3 et 120 caractères." };
  if (description.length < 10 || description.length > 3000) return { error: "La description doit contenir entre 10 et 3 000 caractères." };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("disputes").insert({ order_id: orderId, opened_by: user.id, reason, description, status: "open" });
  if (error) {
    if (error.code === "23505") return { error: "Un dossier de litige existe déjà pour cette commande. Consulte son suivi ci-dessous." };
    if (error.code === "42501" || /row-level security|permission denied|forbidden/i.test(error.message)) {
      return { error: "Cette commande ne peut pas faire l’objet d’un nouveau litige à ce stade, ou tu n’es pas autorisé à l’ouvrir." };
    }
    return { error: "Impossible d’ouvrir le dossier. Réessaie dans un instant." };
  }

  revalidatePath(`/compte/commandes/${orderId}`);
  revalidatePath("/compte/boutique/commandes");
  revalidatePath("/admin/litiges");
  return { error: null, success: true };
}