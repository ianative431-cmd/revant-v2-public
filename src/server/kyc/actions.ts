"use server";

import { redirect } from "next/navigation";
import { requireUserWithLegalConsent } from "@/server/legal/consent";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getShopByOwnerId } from "@/server/shops/shops";

const MAX_FILE_SIZE = 8 * 1024 * 1024;
const MIME_EXTENSIONS: Record<string, string> = {
  "application/pdf": "pdf",
  "image/jpeg": "jpg",
  "image/png": "png",
};

export async function submitKycDocument(formData: FormData): Promise<void> {
  const user = await requireUserWithLegalConsent();
  const supabase = await createSupabaseServerClient();
  const shop = await getShopByOwnerId(supabase, user.id);
  if (!shop) redirect("/compte/boutique?kycError=no-shop");

  const legalName = String(formData.get("legalName") ?? "").trim();
  const documentType = String(formData.get("documentType") ?? "").trim();
  const country = String(formData.get("country") ?? "").trim().toUpperCase();
  const last4 = String(formData.get("last4") ?? "").trim();
  const file = formData.get("document");

  if (legalName.length < 2 || legalName.length > 120) redirect("/compte/boutique/verification?error=identity");
  if (!["national_id", "passport", "driver_license"].includes(documentType)) redirect("/compte/boutique/verification?error=type");
  if (!/^[A-Z]{2}$/.test(country)) redirect("/compte/boutique/verification?error=country");
  if (last4 && !/^\d{4}$/.test(last4)) redirect("/compte/boutique/verification?error=last4");
  if (!(file instanceof File) || file.size <= 0 || file.size > MAX_FILE_SIZE) redirect("/compte/boutique/verification?error=size");
  const extension = MIME_EXTENSIONS[file.type];
  if (!extension) redirect("/compte/boutique/verification?error=format");

  const admin = createSupabaseAdminClient();
  const { data: existing, error: existingError } = await admin
    .from("kyc_profiles")
    .select("id,status,document_path")
    .eq("user_id", user.id)
    .maybeSingle();

  if (existingError) redirect("/compte/boutique/verification?error=load");
  if (existing?.status === "approved" || existing?.status === "pending") {
    redirect("/compte/boutique/verification?error=locked");
  }

  const path = user.id + "/" + Date.now() + "-" + crypto.randomUUID() + "." + extension;
  const { error: uploadError } = await admin.storage
    .from("kyc-documents")
    .upload(path, await file.arrayBuffer(), {
      contentType: file.type,
      cacheControl: "3600",
      upsert: false,
    });

  if (uploadError) redirect("/compte/boutique/verification?error=upload");

  const { error: saveError } = await admin.from("kyc_profiles").upsert(
    {
      user_id: user.id,
      status: "pending",
      legal_name: legalName,
      document_type: documentType,
      document_country: country,
      document_last4: last4 || null,
      document_path: path,
      submitted_at: new Date().toISOString(),
      reviewed_at: null,
      reviewed_by: null,
      rejection_reason: null,
      expires_at: null,
    },
    { onConflict: "user_id" }
  );

  if (saveError) {
    await admin.storage.from("kyc-documents").remove([path]);
    redirect("/compte/boutique/verification?error=save");
  }

  redirect("/compte/boutique/verification?submitted=1");
}
