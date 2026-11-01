import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/types/database";

export type AdminKycRecord = {
  id: string;
  userId: string;
  legalName: string | null;
  email: string | null;
  phone: string | null;
  city: string | null;
  countryCode: string;
  documentType: string | null;
  documentCountry: string | null;
  documentLast4: string | null;
  documentPath: string | null;
  status: Database["public"]["Enums"]["kyc_status"];
  submittedAt: string | null;
  createdAt: string;
  reviewedAt: string | null;
  rejectionReason: string | null;
};

export async function getAdminKycQueue(): Promise<AdminKycRecord[]> {
  const admin = createSupabaseAdminClient();
  const { data: rows, error } = await admin
    .from("kyc_profiles")
    .select("id,user_id,status,legal_name,document_type,document_country,document_last4,document_path,submitted_at,created_at,reviewed_at,rejection_reason")
    .neq("status", "not_started")
    .order("submitted_at", { ascending: false, nullsFirst: false })
    .limit(200);

  if (error) throw new Error("Impossible de charger les dossiers KYC.");

  const userIds = [...new Set((rows ?? []).map((row) => row.user_id))];
  if (userIds.length === 0) return [];

  const [{ data: profiles, error: profileError }, { data: authData, error: authError }] = await Promise.all([
    admin.from("profiles").select("id,display_name,phone,country_code,city").in("id", userIds),
    admin.auth.admin.listUsers({ page: 1, perPage: 1000 }),
  ]);

  if (profileError || authError) throw new Error("Impossible de charger les informations des demandeurs.");

  const profileById = new Map((profiles ?? []).map((profile) => [profile.id, profile]));
  const emailById = new Map((authData?.users ?? []).map((user) => [user.id, user.email ?? null]));

  return (rows ?? []).map((row) => {
    const profile = profileById.get(row.user_id);
    return {
      id: row.id,
      userId: row.user_id,
      legalName: row.legal_name ?? profile?.display_name ?? null,
      email: emailById.get(row.user_id) ?? null,
      phone: profile?.phone ?? null,
      city: profile?.city ?? null,
      countryCode: profile?.country_code ?? "NE",
      documentType: row.document_type,
      documentCountry: row.document_country,
      documentLast4: row.document_last4,
      documentPath: row.document_path,
      status: row.status,
      submittedAt: row.submitted_at,
      createdAt: row.created_at,
      reviewedAt: row.reviewed_at,
      rejectionReason: row.rejection_reason,
    };
  });
}
