"use server";

import { redirect } from "next/navigation";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireUserWithLegalConsent } from "@/server/legal/consent";
import { getCurrentUserRoles, type AppRole } from "@/server/auth/roles";

const ADMIN_ROLES: AppRole[] = [
  "super_admin",
  "admin",
  "moderator",
  "finance_admin",
  "support_admin",
  "kyc_admin",
  "catalog_admin",
  "associate",
];

function isAdminRole(roles: AppRole[]) {
  return ADMIN_ROLES.some((role) => roles.includes(role));
}

function isEnabled() {
  return process.env.ACCOUNT_DELETION_REQUESTS_ENABLED === "true";
}

/**
 * This action records a deletion request only. It never deletes Auth users,
 * profiles, shops, financial history or Storage objects.
 */
export async function requestAccountDeletion(formData: FormData): Promise<void> {
  if (!isEnabled()) redirect("/compte/suppression?status=unavailable");
  if (formData.get("confirmation") !== "SUPPRIMER MON COMPTE") {
    redirect("/compte/suppression?status=confirmation");
  }

  await requireUserWithLegalConsent();
  const roles = await getCurrentUserRoles();
  if (isAdminRole(roles)) redirect("/compte/suppression?status=admin");

  const supabase = await createSupabaseServerClient();
  const db = supabase as unknown as SupabaseClient;
  const { data, error } = await db.rpc("request_account_deletion");

  if (error) {
    // Do not expose database details or identity information to the client.
    redirect("/compte/suppression?status=error");
  }

  const result = (Array.isArray(data) ? data[0] : data) as
    | { request_status?: string }
    | null;
  const status = result?.request_status === "blocked" ? "blocked" : "requested";
  redirect(`/compte/suppression?status=${status}`);
}

export async function cancelAccountDeletion(): Promise<void> {
  if (!isEnabled()) redirect("/compte/suppression?status=unavailable");

  await requireUserWithLegalConsent();
  const supabase = await createSupabaseServerClient();
  const db = supabase as unknown as SupabaseClient;
  const { error } = await db.rpc("cancel_my_account_deletion_request");

  if (error) redirect("/compte/suppression?status=error");
  redirect("/compte/suppression?status=cancelled");
}
