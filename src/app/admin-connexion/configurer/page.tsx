import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { hasAal2, hasVerifiedTotp, isSuperAdminUser } from "@/server/auth/super-admin";
import { hasRecentSuperAdminAuthMethod } from "@/server/auth/super-admin-proof";
import SecureConfigureForm from "./SecureConfigureForm";

export const dynamic = "force-dynamic";

export default async function ConfigureSuperAdminPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !(await isSuperAdminUser(user.id))) redirect("/admin-connexion/initialiser");
  if (!(await hasRecentSuperAdminAuthMethod(supabase, ["otp", "magiclink"], 30 * 60))) redirect("/admin-connexion/initialiser");
  const db = createSupabaseAdminClient();
  const { data: identity, error } = await db.from("super_admin_identities").select("user_id").eq("user_id", user.id).maybeSingle();
  if (error || identity) redirect("/admin-connexion");
  const { data: claim, error: claimError } = await db.from("super_admin_bootstrap_claims").select("user_id,expires_at").eq("id", 1).eq("user_id", user.id).maybeSingle();
  if (claimError || !claim || Date.parse(claim.expires_at) <= Date.now()) redirect("/admin-connexion/initialiser");
  if (!(await hasVerifiedTotp(supabase))) redirect("/admin-connexion/securite");
  if (!(await hasAal2(supabase))) redirect("/admin-connexion/mfa?next=setup");
  return <SecureConfigureForm />;
}
