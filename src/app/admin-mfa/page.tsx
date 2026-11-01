import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireUserWithLegalConsent } from "@/server/legal/consent";
import { getCurrentUserRoles } from "@/server/auth/roles";
import AdminMfaClient from "./AdminMfaClient";

type Props = { searchParams: Promise<{ error?: string }> };

export const dynamic = "force-dynamic";

export default async function AdminMfaPage({ searchParams }: Props) {
  const user = await requireUserWithLegalConsent();
  const roles = await getCurrentUserRoles();
  if (!roles.includes("super_admin")) redirect("/");

  const supabase = await createSupabaseServerClient();
  const [{ data: assurance, error: assuranceError }, { data: factors, error: factorsError }] = await Promise.all([
    supabase.auth.mfa.getAuthenticatorAssuranceLevel(),
    supabase.auth.mfa.listFactors(),
  ]);
  if (assuranceError || factorsError || !assurance || !factors) {
    const { error } = await searchParams;
    return <main className="flex min-h-screen items-center justify-center bg-[#0B0B10] px-4 py-10 text-white"><section className="w-full max-w-md rounded-3xl border border-white/10 bg-white/[0.04] p-6"><h1 className="text-xl font-bold">Vérification de sécurité indisponible</h1><p className="mt-3 text-sm text-white/65">Supabase Auth n’a pas pu vérifier la configuration MFA. Réessaie plus tard ou demande à l’administrateur technique de vérifier les paramètres MFA du projet.</p>{error === "verification" && <p className="mt-3 text-xs text-amber-200">L’accès à l’administration reste bloqué tant que la vérification ne fonctionne pas.</p>}</section></main>;
  }

  const verifiedFactor = factors.totp[0];
  if (verifiedFactor && assurance.currentLevel === "aal2" && assurance.nextLevel === "aal2") {
    redirect("/admin");
  }

  return <AdminMfaClient
    mode={verifiedFactor ? "challenge" : "enroll"}
    factorId={verifiedFactor?.id ?? null}
    email={user.email ?? ""}
  />;
}
