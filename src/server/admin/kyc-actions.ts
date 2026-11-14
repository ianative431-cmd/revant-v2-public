"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requirePermission } from "@/server/auth/roles";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

async function ensureShopCertificationsForKyc(kycId: string, reviewerId: string | null): Promise<{ slugs: string[]; error?: string }> {
  const admin = createSupabaseAdminClient();
  const { data: kyc, error: kycError } = await admin.from("kyc_profiles").select("user_id,status").eq("id", kycId).maybeSingle();
  if (kycError || !kyc || kyc.status !== "approved") return { slugs: [], error: "Dossier KYC approuvé introuvable." };

  // A verified seller identity applies to every shop owned by that account.
  // owner_id is not unique, so retrieve the full collection.
  const { data: shops, error: shopsError } = await admin.from("shops").select("id,slug").eq("owner_id", kyc.user_id);
  if (shopsError || !shops?.length) return { slugs: [], error: "Aucune boutique associée à ce vendeur." };

  const certification = { status: "approved" as const, badge_label: "Boutique certifiée", badge_color: "#2563EB", reviewed_by: reviewerId, reviewed_at: new Date().toISOString() };
  for (const shop of shops) {
    const { data: existing, error: existingError } = await admin.from("certifications").select("id").eq("shop_id", shop.id).eq("type", "shop");
    if (existingError) return { slugs: [], error: "Impossible de lire la certification existante." };
    const saved = existing?.length
      ? await admin.from("certifications").update(certification).eq("shop_id", shop.id).eq("type", "shop")
      : await admin.from("certifications").insert({ shop_id: shop.id, type: "shop", ...certification });
    if (saved.error) return { slugs: [], error: "Impossible d'enregistrer le badge bleu." };
  }
  return { slugs: shops.map((shop) => shop.slug) };
}

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
    p_reason: action === "reject" ? reason : undefined,
  });

  if (error) {
    const message = error.message ?? "";
    if (message.includes("kyc_document_missing")) redirect("/admin/kyc?error=document");
    if (message.includes("kyc_not_pending")) redirect("/admin/kyc?error=reviewed");
    if (message.includes("forbidden")) redirect("/admin");
    redirect("/admin/kyc?error=save");
  }

  if (action === "approve") {
    const { data: { user: reviewer } } = await supabase.auth.getUser();
    const certification = await ensureShopCertificationsForKyc(id, reviewer?.id ?? null);
    if (certification.error) redirect("/admin/kyc?status=approved&error=certification&kycId=" + encodeURIComponent(id));
    for (const slug of certification.slugs) revalidatePath("/shop/" + slug);
  }

  revalidatePath("/admin/kyc");
  redirect("/admin/kyc?status=" + (action === "approve" ? "approved" : "rejected") + "&notice=" + (action === "approve" ? "approved" : "rejected"));
}

export async function syncApprovedShopCertificationAction(formData: FormData): Promise<void> {
  await requirePermission("kyc.manage");
  const id = String(formData.get("kycId") ?? "");
  if (!UUID_RE.test(id)) redirect("/admin/kyc?status=approved&error=invalid");
  const supabase = await createSupabaseServerClient();
  const { data: { user: reviewer } } = await supabase.auth.getUser();
  const certification = await ensureShopCertificationsForKyc(id, reviewer?.id ?? null);
  if (certification.error) redirect("/admin/kyc?status=approved&error=certification&kycId=" + encodeURIComponent(id));
  revalidatePath("/admin/kyc");
  for (const slug of certification.slugs) revalidatePath("/shop/" + slug);
  redirect("/admin/kyc?status=approved&notice=certified");
}
