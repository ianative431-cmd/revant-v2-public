import { requireSuperAdmin } from "@/server/auth/roles";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createMaisonLink, setMaisonLinkActive, updateMaisonLink } from "./actions";

type MaisonLink = { id: string; title: string; url: string; description: string | null; is_active: boolean; sort_order: number; created_at: string };
const STATUS: Record<string, string> = { created: "Destination ajoutée.", updated: "Destination mise à jour.", activated: "Destination activée.", deactivated: "Destination désactivée.", invalid: "Vérifie le titre et utilise une URL HTTPS valide.", database_error: "La sauvegarde a échoué. Vérifie que la migration SQL est appliquée dans Supabase." };

export default async function MaisonAdminPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  await requireSuperAdmin();
  const { status } = await searchParams;
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.from("external_destination_links").select("id,title,url,description,is_active,sort_order,created_at").order("sort_order", { ascending: true }).order("created_at", { ascending: false });
  const links = (data ?? []) as MaisonLink[];
  return <div className="mx-auto max-w-4xl space-y-6">
    <div><p className="text-xs font-bold uppercase tracking-[.18em] text-[#803e2f]">Centre de configuration</p><h1 className="mt-2 text-2xl font-black">Maison & liens immobiliers</h1><p className="mt-2 max-w-2xl text-sm leading-relaxed text-black/60">Gère les sites externes affichés dans la rubrique Maison. Revant ne publie pas directement d’annonces immobilières ici. Seul le super administrateur peut modifier cette liste.</p></div>
    {status && STATUS[status] && <p role="status" className={`rounded-xl p-3 text-sm ${status === "invalid" || status === "database_error" ? "bg-red-50 text-red-800" : "bg-green-50 text-green-800"}`}>{STATUS[status]}</p>}
    {error && <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900"><p className="font-bold">La table de configuration n’est pas disponible.</p><p className="mt-1">Applique la migration <code>20261011120000_external_destination_links.sql</code> dans Supabase, puis recharge cette page.</p></div>}
    <section className="rounded-2xl bg-white p-5 shadow-sm"><h2 className="text-base font-bold">Ajouter une destination</h2><form action={createMaisonLink} className="mt-4 grid gap-3 sm:grid-cols-2">
      <label className="text-xs font-semibold">Nom affiché<input name="title" required minLength={2} maxLength={100} placeholder="Ex. Portail immobilier" className="mt-1 w-full rounded-lg border border-black/15 px-3 py-2.5 text-sm font-normal" /></label>
      <label className="text-xs font-semibold">Adresse HTTPS<input name="url" type="url" required placeholder="https://exemple.com" pattern="https://.*" className="mt-1 w-full rounded-lg border border-black/15 px-3 py-2.5 text-sm font-normal" /></label>
      <label className="text-xs font-semibold sm:col-span-2">Description facultative<input name="description" maxLength={300} placeholder="Courte explication visible aux visiteurs" className="mt-1 w-full rounded-lg border border-black/15 px-3 py-2.5 text-sm font-normal" /></label>
      <label className="text-xs font-semibold">Ordre d’affichage<input name="sort_order" type="number" min={0} max={10000} defaultValue={0} className="mt-1 w-full rounded-lg border border-black/15 px-3 py-2.5 text-sm font-normal" /></label>
      <div className="flex items-end"><button type="submit" disabled={Boolean(error)} className="rounded-full bg-[#803e2f] px-5 py-3 text-sm font-bold text-white disabled:opacity-40">Ajouter le lien</button></div>
    </form></section>
    <section className="space-y-3"><div className="flex items-center justify-between"><h2 className="text-base font-bold">Destinations enregistrées</h2><span className="text-xs text-black/50">{links.length} lien{links.length === 1 ? "" : "s"}</span></div>
      {!error && links.length === 0 && <p className="rounded-xl bg-white p-5 text-sm text-black/50">Aucun lien pour le moment. Ajoute une destination ci-dessus pour la rendre disponible sur la page Maison.</p>}
      {links.map((link) => <article key={link.id} className="rounded-2xl bg-white p-4 shadow-sm"><div className="mb-3 flex items-center justify-between gap-3"><span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${link.is_active ? "bg-green-100 text-green-800" : "bg-black/5 text-black/50"}`}>{link.is_active ? "Actif" : "Désactivé"}</span><form action={setMaisonLinkActive}><input type="hidden" name="id" value={link.id}/><input type="hidden" name="title" value={link.title}/><input type="hidden" name="is_active" value={String(!link.is_active)}/><button type="submit" className="text-xs font-semibold underline">{link.is_active ? "Désactiver" : "Activer"}</button></form></div>
        <form action={updateMaisonLink} className="grid gap-3 sm:grid-cols-2"><input type="hidden" name="id" value={link.id}/>
          <label className="text-xs font-semibold">Nom affiché<input name="title" required minLength={2} maxLength={100} defaultValue={link.title} className="mt-1 w-full rounded-lg border border-black/15 px-3 py-2.5 text-sm font-normal"/></label>
          <label className="text-xs font-semibold">Adresse HTTPS<input name="url" type="url" required pattern="https://.*" defaultValue={link.url} className="mt-1 w-full rounded-lg border border-black/15 px-3 py-2.5 text-sm font-normal"/></label>
          <label className="text-xs font-semibold sm:col-span-2">Description<input name="description" maxLength={300} defaultValue={link.description ?? ""} className="mt-1 w-full rounded-lg border border-black/15 px-3 py-2.5 text-sm font-normal"/></label>
          <label className="text-xs font-semibold">Ordre<input name="sort_order" type="number" min={0} max={10000} defaultValue={link.sort_order} className="mt-1 w-full rounded-lg border border-black/15 px-3 py-2.5 text-sm font-normal"/></label>
          <div className="flex items-end"><button type="submit" className="rounded-full border border-black/20 px-5 py-3 text-sm font-bold">Enregistrer les modifications</button></div>
        </form>
      </article>)}
    </section>
  </div>;
}
