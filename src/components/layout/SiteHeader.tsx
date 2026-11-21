import Image from "next/image";
import Link from "next/link";
import { Search, UserRound, ShoppingBag, Menu } from "lucide-react";
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
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[var(--brand-header)] text-[var(--brand-header-text)] shadow-sm">
      <div className="mx-auto flex h-[56px] min-h-[56px] max-w-[1500px] items-center justify-between gap-2 px-3 sm:h-16 sm:min-h-16 sm:px-7">
        <div className="flex shrink-0 items-center gap-2">
          <details className="relative md:hidden">
            <summary aria-label="Ouvrir le menu principal" className="flex min-h-10 min-w-10 list-none cursor-pointer items-center justify-center rounded-xl hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--brand-accent)]">
              <Menu {...iconProps} size={23} />
            </summary>
            <nav aria-label="Menu principal" className="absolute left-0 top-12 z-50 w-64 rounded-2xl border border-[var(--brand-border)] bg-[var(--brand-header)] p-2 text-sm text-[var(--brand-header-text)] shadow-2xl">
              <p className="px-3 pb-2 pt-3 text-[10px] font-bold uppercase tracking-[.18em] opacity-60">Explorer Revant</p>
              {quickLinks.map((item) => (
                <Link key={item.href + item.label} href={item.href} className="block rounded-xl px-3 py-3 font-medium hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--brand-accent)]">
                  {item.label}
                </Link>
              ))}
            </nav>
          </details>
          <Link href="/" aria-label="Revant — accueil" className="shrink-0 rounded-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--brand-accent)]">
            <Image src="/images/revant-box-mark.svg" alt="Revant" width={40} height={40} priority unoptimized className="revant-brand-mark h-8 w-8 object-contain sm:h-10 sm:w-10" />
          </Link>
        </div>

        <nav aria-label="Navigation principale" className="hidden items-center gap-5 text-xs font-semibold md:flex lg:gap-7">
          <Link href="/" className="hover:text-white/75">Accueil</Link>
          <Link href="/boutiques" className="hover:text-white/75">Boutiques</Link>
          <Link href="/#categories" className="hover:text-white/75">Catégories</Link>
          <Link href="/restaurants" className="hover:text-white/75">Restaurants</Link>
          <Link href="/#a-propos" className="hover:text-white/75">À propos</Link>
        </nav>

        <div className="flex items-center gap-1 sm:gap-2">
          {!hideSearch && (
            <form action="/" method="get" role="search" className="hidden items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-2 backdrop-blur-md sm:flex">
              <Search {...iconProps} />
              <input name="q" aria-label="Rechercher des produits" placeholder="Rechercher" className="w-24 bg-transparent text-xs text-white outline-none placeholder:text-white/60 sm:w-32" />
              <PhotoActionMenu allowAdd={allowAdd} />
            </form>
          )}
          <Link href="/compte" aria-label="Mon compte" className="flex min-h-10 min-w-10 items-center justify-center rounded-full hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--brand-accent)]">
            <UserRound {...iconProps} />
          </Link>
          <Link href="/panier" aria-label="Mon panier" className="flex min-h-10 min-w-10 items-center justify-center rounded-full hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--brand-accent)]">
            <ShoppingBag {...iconProps} />
          </Link>
        </div>
      </div>

      {!hideSearch && (
        <div className="px-3 pb-2 sm:hidden">
          <form action="/" method="get" role="search" className="flex h-10 min-h-10 items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 text-white shadow-sm backdrop-blur-md focus-within:ring-2 focus-within:ring-[var(--brand-accent)]">
            <Search {...iconProps} />
            <input name="q" aria-label="Rechercher des produits, boutiques et catégories" placeholder="Rechercher produits, boutiques…" className="h-full min-h-0 min-w-0 flex-1 bg-transparent py-0 text-sm text-white outline-none placeholder:text-white/60" />
            <PhotoActionMenu allowAdd={allowAdd} />
            <button type="submit" aria-label="Lancer la recherche" className="h-8 shrink-0 rounded-full bg-[var(--brand-accent)] px-3 text-xs font-bold text-white">OK</button>
          </form>
        </div>
      )}
    </header>
  );
}
