import Link from "next/link";
import PaletteSwitcher from "./PaletteSwitcher";
import { getSitePalette } from "@/server/theme/site-palette";

function SearchIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5" aria-hidden="true"><circle cx="10.8" cy="10.8" r="6.8"/><path d="m16 16 4 4" strokeLinecap="round"/></svg>;
}
function UserIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5" aria-hidden="true"><circle cx="12" cy="8" r="3.3"/><path d="M5 20c1.2-3.5 4-5.3 7-5.3s5.8 1.8 7 5.3" strokeLinecap="round"/></svg>;
}
function BagIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5" aria-hidden="true"><path d="M5 8h14l1 12H4L5 8Z" strokeLinejoin="round"/><path d="M9 9V6a3 3 0 0 1 6 0v3" strokeLinecap="round"/></svg>;
}

export default async function SiteHeader() {
  const palette = await getSitePalette();
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[#090909] text-white">
      <div className="mx-auto flex min-h-[68px] max-w-[1500px] items-center justify-between gap-4 px-4 sm:px-7">
        <Link href="/" className="shrink-0 text-2xl font-black tracking-tight sm:text-3xl">REVANT</Link>
        <nav className="hidden items-center gap-7 text-xs font-medium text-white/85 md:flex">
          <Link href="/" className="border-b-2 border-white py-6">Accueil</Link>
          <Link href="#boutiques-paysannes" className="py-6 hover:text-white">Boutique</Link>
          <Link href="/#categories" className="py-6 hover:text-white">Catégories</Link>
          <Link href="/#a-propos" className="py-6 hover:text-white">À propos</Link>
        </nav>
        <div className="flex items-center gap-3 sm:gap-4">
          <form action="/" method="get" className="hidden items-center gap-2 rounded-full border border-white/20 px-3 py-2 sm:flex">
            <SearchIcon />
            <input name="q" aria-label="Rechercher des produits" placeholder="Rechercher" className="w-24 bg-transparent text-xs text-white outline-none placeholder:text-white/50 sm:w-32" />
          </form>
          <Link href="/?q=" aria-label="Rechercher" className="sm:hidden"><SearchIcon /></Link>
          <Link href="/compte" aria-label="Mon compte"><UserIcon /></Link>
          <Link href="/#produits" aria-label="Voir les produits"><BagIcon /></Link>
          <div className="hidden lg:block"><PaletteSwitcher current={palette} /></div>
        </div>
      </div>
      <nav className="flex gap-5 overflow-x-auto px-4 pb-3 text-xs text-white/75 md:hidden">
        <Link href="/">Accueil</Link><Link href="/#boutiques-paysannes">Boutique</Link><Link href="/#categories">Catégories</Link><Link href="/#a-propos">À propos</Link>
      </nav>
    </header>
  );
}
