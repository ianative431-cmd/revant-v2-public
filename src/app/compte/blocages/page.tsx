import Link from "next/link";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireUserWithLegalConsent } from "@/server/legal/consent";
import { unblockUser } from "@/server/messages/block-actions";

export default async function BlockedAccountsPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const user = await requireUserWithLegalConsent();
  const { status } = await searchParams;
  const supabase = await createSupabaseServerClient();
  const db = supabase as unknown as SupabaseClient;
  const { data, error } = await db
    .from("user_blocks")
    .select("blocked_id,created_at")
    .eq("blocker_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <main className="min-h-screen bg-brand-bg px-4 py-8 text-brand-text">
      <div className="mx-auto max-w-xl">
        <Link href="/compte" className="text-sm underline text-brand-muted">← Mon compte</Link>
        <h1 className="mt-4 text-xl font-bold">Comptes bloqués</h1>
        <p className="mt-1 text-sm text-brand-muted">Les comptes bloqués ne peuvent plus t’envoyer de nouveaux messages et leurs conversations sont masquées.</p>
        {status === "blocked" && <p role="status" className="mt-4 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">Compte bloqué. Tu peux le débloquer ici à tout moment.</p>}
        {error ? (
          <p className="mt-5 rounded-xl bg-white p-4 text-sm text-red-700">Impossible de charger les comptes bloqués.</p>
        ) : !data?.length ? (
          <p className="mt-5 rounded-xl bg-white p-5 text-sm text-brand-muted">Tu n’as bloqué aucun compte.</p>
        ) : (
          <div className="mt-5 space-y-3">
            {data.map((entry) => (
              <article key={entry.blocked_id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-white p-4">
                <div className="min-w-0">
                  <p className="text-sm font-semibold">Compte {entry.blocked_id.slice(0, 8)}…</p>
                  <p className="mt-1 text-xs text-brand-muted">Bloqué le {new Date(entry.created_at).toLocaleDateString("fr-FR")}</p>
                </div>
                <form action={unblockUser}>
                  <input type="hidden" name="blockedId" value={entry.blocked_id} />
                  <button type="submit" className="rounded-full border border-brand-border px-4 py-2 text-xs font-semibold">Débloquer</button>
                </form>
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
