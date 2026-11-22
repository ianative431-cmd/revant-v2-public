import Link from "next/link";
import { Menu, Search } from "lucide-react";
import PhotoActionMenu from "./PhotoActionMenu";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const iconProps = { size: 20, strokeWidth: 1.8, "aria-hidden": true as const };
const quickLinks = [
  { href: "/parametres", label: "Paramètres" },
  { href: "/compte/commandes", label: "Mes commandes" },
  { href: "/boutiques/creer", label: "Vendre sur Revant" },
  { href: "/legal", label: "Centre juridique" },
];

export default async function SiteHeader({ hideSearch = false }: { hideSearch?: boolean }) {
  let allowAdd = false;
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    allowAdd = Boolean(user);
  } catch {
    allowAdd = false;
  }

  return (
    <div className="pointer-events-none fixed inset-x-0 top-[calc(env(safe-area-inset-top,0px)+12px)] z-[70] flex items-start justify-center px-3" aria-label="Commandes flottantes Revant">
      <details className="pointer-events-auto absolute left-3 top-0 group">
        <summary aria-label="Ouvrir le menu principal" className="flex h-11 w-11 list-none cursor-pointer items-center justify-center rounded-full border border-brand-border bg-brand-surface/95 text-brand-text shadow-lg backdrop-blur-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-accent [&::-webkit-details-marker]:hidden">
          <Menu {...iconProps} size={22} />
        </summary>
        <nav aria-label="Menu principal" className="absolute left-0 top-14 z-[71] w-64 rounded-2xl border border-brand-border bg-brand-surface p-2 text-sm text-brand-text shadow-2xl backdrop-blur-xl">
          <p className="px-3 pb-2 pt-3 text-[10px] font-bold uppercase tracking-[.18em] text-brand-muted">Explorer Revant</p>
          {quickLinks.map((item) => (
            <Link key={item.href + item.label} href={item.href} className="block rounded-xl px-3 py-3 font-medium hover:bg-brand-bg focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-accent">
              {item.label}
            </Link>
          ))}
        </nav>
      </details>

      {!hideSearch && (
        <form action="/#produits" method="get" role="search" className="pointer-events-auto flex h-11 w-[calc(100%-76px)] max-w-[560px] items-center gap-2 rounded-full border border-brand-border bg-brand-surface/95 px-3 text-brand-text shadow-lg backdrop-blur-xl focus-within:border-brand-accent focus-within:ring-2 focus-within:ring-brand-accent/20">
          <button type="submit" aria-label="Lancer la recherche" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-brand-muted transition hover:bg-brand-bg hover:text-brand-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-accent"><Search size={19} strokeWidth={1.8} aria-hidden /></button>
          <input name="q" aria-label="Rechercher des produits, boutiques et catégories" placeholder="Rechercher…" className="h-full min-w-0 flex-1 bg-transparent text-sm text-brand-text outline-none placeholder:text-brand-muted" />
          <PhotoActionMenu allowAdd={allowAdd} />
        </form>
      )}
    </div>
  );
}
