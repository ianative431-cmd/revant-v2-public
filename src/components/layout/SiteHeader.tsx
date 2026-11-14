import Image from "next/image";
import Link from "next/link";
import { Search, UserRound, ShoppingBag, Menu, MoreVertical } from "lucide-react";
import PhotoActionMenu from "./PhotoActionMenu";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const iconProps = { size: 20, strokeWidth: 1.65, "aria-hidden": true as const };

const quickLinks = [
  { href: "/boutiques", label: "Toutes les boutiques" },
  { href: "/#categories", label: "Catégories Revant Mega" },
  { href: "/restaurants", label: "Restaurants" },
  { href: "/compte/commandes", label: "Mes commandes" },
  { href: "/boutiques/creer", label: "Vendre sur Revant" },
  { href: "/parametres", label: "Paramètres" },
];

export default async function SiteHeader() {
  let allowAdd = false;
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    allowAdd = Boolean(user);
  } catch {
    allowAdd = false;
  }

  return (
    <header className="sticky top-0 z-40 border-b-0 bg-transparent text-[var(--brand-header-text)] shadow-none">
      <div className="mx-auto flex h-[52px] min-h-[52px] sm:h-auto sm:min-h-[64px] max-w-[1500px] items-center justify-between gap-2 px-3 sm:px-7">
        <div aria-hidden="true" className="invisible flex shrink-0 items-center gap-1 pointer-events-none">
          <details className="relative md:hidden">
            <summary aria-label="Ouvrir le menu principal" className="flex min-h-11 min-w-10 list-none cursor-pointer items-center justify-center rounded-xl hover:bg-[var(--brand-surface)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--brand-accent)]"><Menu {...iconProps} size={24} /></summary>
            <nav aria-label="Menu principal" className="absolute left-0 top-12 z-50 w-64 rounded-2xl border border-[var(--brand-border)] bg-[var(--brand-header)] p-2 text-sm text-[var(--brand-header-text)] shadow-2xl">
              <p className="px-3 pb-2 pt-3 text-[10px] font-bold uppercase tracking-[.18em] opacity-60">Explorer Revant</p>
              {quickLinks.map((item) => <Link key={item.href + item.label} href={item.href} className="block rounded-xl px-3 py-3 font-medium hover:bg-[var(--brand-surface)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--brand-accent)]">{item.label}</Link>)}
            </nav>
          </details>
          <Link href="/" aria-label="Revant — accueil" className="shrink-0 rounded-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--brand-accent)]">
            <Image src="/images/logo-revant-app-512.png" alt="Revant" width={40} height={40} priority className="h-8 w-8 object-contain sm:h-10 sm:w-10" />
          </Link>
        </div>

        <nav aria-hidden="true" className="invisible hidden items-center gap-7 text-xs font-medium opacity-85 md:flex pointer-events-none">
          <Link href="/">Accueil</Link><Link href="/boutiques">Boutiques</Link><Link href="/#categories">Catégories</Link><Link href="/restaurants">Restaurants</Link><Link href="/#a-propos">À propos</Link>
        </nav>
        <div className="flex items-center gap-1 sm:gap-3">
          <form action="/" method="get" role="search" className="hidden items-center gap-2 rounded-full border border-black/10 bg-white/65 px-3 py-2 shadow-sm backdrop-blur-md sm:flex">
            <Search {...iconProps} /><input name="q" aria-label="Rechercher des produits" placeholder="Rechercher" className="w-24 bg-transparent text-xs text-[var(--brand-text)] outline-none placeholder:opacity-60 sm:w-32"/>
            <PhotoActionMenu allowAdd={allowAdd} />
          </form>
          <Link href="/compte" aria-label="Mon compte" className="invisible pointer-events-none rounded-full p-2 hover:bg-[var(--brand-surface)]"><UserRound {...iconProps} /></Link>
          <Link href="/boutiques" aria-label="Découvrir les boutiques" className="invisible pointer-events-none rounded-full p-2 hover:bg-[var(--brand-surface)]"><ShoppingBag {...iconProps} /></Link>
          <details aria-hidden="true" className="invisible relative pointer-events-none">
            <summary aria-label="Plus d’options" className="flex min-h-10 min-w-9 list-none items-center justify-center rounded-full hover:bg-[var(--brand-surface)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--brand-accent)]"><MoreVertical {...iconProps} /></summary>
            <nav aria-label="Plus d’options" className="absolute right-0 top-11 z-50 w-60 rounded-2xl border border-[var(--brand-border)] bg-[var(--brand-header)] p-2 text-sm text-[var(--brand-header-text)] shadow-2xl">
              {quickLinks.map((item) => <Link key={item.href + item.label} href={item.href} className="block rounded-xl px-3 py-3 font-medium hover:bg-[var(--brand-surface)]">{item.label}</Link>)}
            </nav>
          </details>
        </div>
      </div>
      <div className="px-3 pb-1 sm:hidden">
        <form action="/" method="get" role="search" className="flex h-10 min-h-10 items-center gap-2 rounded-full border border-black/10 bg-white/65 px-3 text-[var(--brand-text)] shadow-sm backdrop-blur-md focus-within:ring-2 focus-within:ring-[var(--brand-accent)]">
          <Search {...iconProps} />
          <input name="q" aria-label="Rechercher des produits, boutiques et catégories" placeholder="Rechercher produits, boutiques…" className="h-full min-h-0 min-w-0 flex-1 bg-transparent py-0 text-sm outline-none placeholder:opacity-60"/>
          <PhotoActionMenu allowAdd={allowAdd} />
          <button type="submit" aria-label="Lancer la recherche" className="h-8 shrink-0 rounded-full bg-[var(--brand-accent)] px-3 text-xs font-bold text-white">OK</button>
        </form>
      </div>
    </header>
  );
}
