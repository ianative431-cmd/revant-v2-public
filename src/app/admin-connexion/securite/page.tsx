import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { hasVerifiedTotp, isSuperAdminUser } from "@/server/auth/super-admin";
import { hasRecentSuperAdminAuthMethod } from "@/server/auth/super-admin-proof";
import SecureTotpEnrollment from "./SecureTotpEnrollment";

export const dynamic = "force-dynamic";

export default async function SuperAdminSecuritySetupPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !(await isSuperAdminUser(user.id))) redirect("/admin-connexion/initialiser");
  if (!(await hasRecentSuperAdminAuthMethod(supabase, ["otp", "magiclink"], 30 * 60))) redirect("/admin-connexion/initialiser");
  if (await hasVerifiedTotp(supabase)) redirect("/admin-connexion/mfa?next=setup");
  return <main className="flex min-h-screen items-center justify-center bg-[#171013] px-5 py-10 text-white"><SecureTotpEnrollment /></main>;
}
