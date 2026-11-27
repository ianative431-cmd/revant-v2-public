import { createSupabaseServerClient } from "@/lib/supabase/server";
import { hasAal2, hasVerifiedTotp, isSuperAdminUser } from "@/server/auth/super-admin";
import { hasRecentSuperAdminAuthMethod } from "@/server/auth/super-admin-proof";
import RecoveryRequestForm from "./RecoveryRequestForm";
import RecoveryMfaForm from "./RecoveryMfaForm";
import NewSuperAdminKeyForm from "./NewKeyForm";

export const dynamic = "force-dynamic";

export default async function SuperAdminRecoveryPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  const recoveryProof = Boolean(
    user && (await isSuperAdminUser(user.id)) &&
    (await hasRecentSuperAdminAuthMethod(supabase, ["recovery"], 30 * 60))
  );
  if (!recoveryProof) {
    return <main className="flex min-h-screen items-center justify-center bg-[#171013] px-5 py-10 text-white"><RecoveryRequestForm /></main>;
  }
  if (!(await hasVerifiedTotp(supabase))) {
    return <main className="flex min-h-screen items-center justify-center bg-[#171013] px-5 py-10 text-white"><section className="max-w-md rounded-3xl border border-white/10 bg-white/[0.04] p-6"><h1 className="text-xl font-semibold">Second facteur indisponible</h1><p className="mt-3 text-sm leading-6 text-white/65">Aucun facteur TOTP vérifié n’est disponible. Pour éviter qu’un simple accès à l’e-mail ne contourne la sécurité, cette récupération est bloquée. Utilise un facteur de secours préalablement enregistré ou une procédure indépendante.</p></section></main>;
  }
  if (!(await hasAal2(supabase))) {
    return <main className="flex min-h-screen items-center justify-center bg-[#171013] px-5 py-10 text-white"><RecoveryMfaForm /></main>;
  }
  return <main className="flex min-h-screen items-center justify-center bg-[#171013] px-5 py-10 text-white"><NewSuperAdminKeyForm /></main>;
}
