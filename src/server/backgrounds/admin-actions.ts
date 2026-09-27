"use server";

import { redirect } from "next/navigation";
import { requireAdmin } from "@/server/auth/roles";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  OFFICIAL_BACKGROUND_BUCKET,
  BACKGROUND_IMAGE_ALLOWED_TYPES,
  BACKGROUND_IMAGE_MAX_BYTES,
  buildOfficialBackgroundPath,
} from "@/lib/background-image";

export type BackgroundActionState = { error: string | null };

const NAME_MIN = 2;
const NAME_MAX = 80;

export async function createBackground(
  _prevState: BackgroundActionState,
  formData: FormData
): Promise<BackgroundActionState> {
  const admin = await requireAdmin();
  const supabase = await createSupabaseServerClient();

  const name = String(formData.get("name") ?? "").trim();
  const category = String(formData.get("category") ?? "").trim() || "autres";
  const description = String(formData.get("description") ?? "").trim();
  const file = formData.get("image");

  if (name.length < NAME_MIN || name.length > NAME_MAX) {
    return { error: `Le nom doit contenir entre ${NAME_MIN} et ${NAME_MAX} caractères.` };
  }
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Sélectionne une image." };
  }
  if (!BACKGROUND_IMAGE_ALLOWED_TYPES.includes(file.type)) {
    return { error: "Format non supporté (JPEG, PNG ou WebP attendus)." };
  }
  if (file.size > BACKGROUND_IMAGE_MAX_BYTES) {
    return { error: "Image trop volumineuse (8 Mo maximum)." };
  }

  const path = buildOfficialBackgroundPath();
  const bytes = new Uint8Array(await file.arrayBuffer());

  const { error: uploadError } = await supabase.storage
    .from(OFFICIAL_BACKGROUND_BUCKET)
    .upload(path, bytes, { contentType: file.type, upsert: false });

  if (uploadError) {
    return { error: "Échec de l'envoi de l'image. Réessaie." };
  }

  const { error: insertError } = await supabase.from("backgrounds").insert({
    name,
    category,
    description: description.length > 0 ? description : null,
    image_path: path,
    created_by: admin.id,
  });

  if (insertError) {
    // Nettoyage du fichier orphelin si l'enregistrement échoue.
    await supabase.storage.from(OFFICIAL_BACKGROUND_BUCKET).remove([path]);
    return { error: "Impossible d'enregistrer l'arrière-plan." };
  }

  redirect("/admin/arriere-plans");
}

export async function toggleBackgroundActive(
  _prevState: BackgroundActionState,
  formData: FormData
): Promise<BackgroundActionState> {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();

  const id = String(formData.get("id") ?? "");
  const nextActive = String(formData.get("nextActive") ?? "") === "true";

  const { error } = await supabase.from("backgrounds").update({ is_active: nextActive }).eq("id", id);
  if (error) {
    return { error: "Impossible de mettre à jour l'arrière-plan." };
  }

  redirect("/admin/arriere-plans");
}

export async function deleteBackground(
  _prevState: BackgroundActionState,
  formData: FormData
): Promise<BackgroundActionState> {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();

  const id = String(formData.get("id") ?? "");
  const path = String(formData.get("path") ?? "");

  // Les boutiques qui l'utilisaient repassent automatiquement à l'arrière-
  // plan par défaut (colonne shops.background_id en "on delete set null",
  // migration 0007) — aucune référence cassée.
  const { error } = await supabase.from("backgrounds").delete().eq("id", id);
  if (error) {
    return { error: "Impossible de supprimer cet arrière-plan." };
  }

  if (path) {
    await supabase.storage.from(OFFICIAL_BACKGROUND_BUCKET).remove([path]);
  }

  redirect("/admin/arriere-plans");
}
