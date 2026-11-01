"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requirePermission } from "@/server/auth/roles";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function getKycDocumentUrl(kycId: string): Promise<{ url?: string; error?: string }> {
  await requirePermission("kyc.manage");
  if (!UUID_RE.test(kycId)) return { error: "Dossier invalide." };

  const admin = createSupabaseAdminClient();
  const { data: record, error } = await admin
    .from("kyc_profiles")
    .select("user_id, document_path")
    .eq("id", kycId)
    .maybeSingle();

  if (error || !record) return { error: "Dossier introuvable." };
  const path = record.document_path;
  if (!path || !path.startsWith(record.user_id + "/") || path.includes("..") || path.includes("\\") || path.startsWith("/")) {
    return { error: "Aucun document privé n'est associé à ce dossier." };
  }

  const parts = path.split("/");
  if (parts.length !== 2 || !/^[a-zA-Z0-9._-]{1,180}$/.test(parts[1])) {
    return { error: "Chemin du document invalide." };
  }

  // The bucket is private; the object must exist under the user's own folder.
  const { data: files, error: listError } = await admin.storage
    .from("kyc-documents")
    .list(record.user_id, { search: parts[1], limit: 100 });

  if (listError || !files?.some((file) => file.name === parts[1])) {
    return { error: "Le fichier n'existe plus dans le stockage privé." };
  }

  const { data: signed, error: signError } = await admin.storage
    .from("kyc-documents")
    .createSignedUrl(path, 60);

  if (signError || !signed?.signedUrl) return { error: "Impossible de générer le lien sécurisé." };
  return { url: signed.signedUrl };
}

export async function updateKycStatusAction(formData: FormData): Promise<void> {
  await requirePermission("kyc.manage");

  const id = String(formData.get("kycId") ?? "");
  const action = String(formData.get("action") ?? "");
  const reason = String(formData.get("reason") ?? "").trim();

  if (!UUID_RE.test(id) || (action !== "approve" && action !== "reject")) {
    redirect("/admin/kyc?error=invalid");
  }
  if (action === "reject" && (reason.length < 5 || reason.length > 500)) {
    redirect("/admin/kyc?error=reason");
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("admin_update_kyc", {
    p_kyc_id: id,
    p_action: action,
    p_reason: action === "reject" ? reason : null,
  });

  if (error) {
    const message = error.message ?? "";
    if (message.includes("kyc_document_missing")) redirect("/admin/kyc?error=document");
    if (message.includes("kyc_not_pending")) redirect("/admin/kyc?error=reviewed");
    if (message.includes("forbidden")) redirect("/admin");
    redirect("/admin/kyc?error=save");
  }

  revalidatePath("/admin/kyc");
  redirect("/admin/kyc?status=" + (action === "approve" ? "approved" : "rejected") + "&notice=" + (action === "approve" ? "approved" : "rejected"));
}
