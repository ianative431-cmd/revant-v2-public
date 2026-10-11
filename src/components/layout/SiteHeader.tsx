import Link from "next/link";
import Image from "next/image";
import PaletteSwitcher from "./PaletteSwitcher";
import PhotoActionMenu from "./PhotoActionMenu";
import { getSitePalette } from "@/server/theme/site-palette";

function SearchIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5" aria-hidden="true"><circle cx="10.8" cy="10.8" r="6.8"/><path d="m16 16 4 4" strokeLinecap="round"/></svg>;
}
function UserIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5" aria-hidden="true"><circle cx="12" cy="8" r="3.3"/><path d="M5 20c1.2-3.5 4-5.3 7-5.3s5.8 1.8 7 5.3" strokeLinecap="round"/></svg>;
}
function BagIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5" aria-hidden="true"><path d="M5 8h14l1 12H4L5 8Z"/><path d="M9 9V6a3 3 0 0 1 6 0v3" strokeLinecap="round"/></svg>;
}
function MenuIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" className="h-6 w-6" aria-hidden="true"><path d="M3.5 6h17M3.5 12h17M3.5 18h17" strokeLinecap="round"/></svg>;
}
function MoreIcon() {
  return <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5" aria-hidden="true"><circle cx="12" cy="5" r="1.7"/><circle cx="12" cy="12" r="1.7"/><circle cx="12" cy="19" r="1.7"/></svg>;
}
const quickLinks = [
  { href: "/boutiques", label: "Toutes les boutiques" },
  { href: "/#categories", label: "Catégories Revant Mega" },
  { href: "/restaurants", label: "Restaurants" },
  { href: "/compte/commandes", label: "Mes commandes" },
  { href: "/boutiques/creer", label: "Vendre sur Revant" },
  { href: "/compte", label: "Mon compte" },
];
export default async function SiteHeader() {
  const palette = await getSitePalette();
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[#090909] text-white shadow-sm">
      <div className="mx-auto flex min-h-[64px] max-w-[1500px] items-center justify-between gap-2 px-3 sm:px-7">
        <details className="relative md:hidden">
          <summary aria-label="Ouvrir le menu principal" className="flex min-h-11 min-w-10 list-none cursor-pointer items-center justify-center rounded-xl hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"><MenuIcon/></summary>
          <nav aria-label="Menu principal" className="absolute left-0 top-12 z-50 w-64 rounded-2xl border border-black/10 bg-white p-2 text-sm text-neutral-900 shadow-2xl">
            <p className="px-3 pb-2 pt-3 text-[10px] font-bold uppercase tracking-[.18em] text-neutral-500">Explorer Revant</p>
            {quickLinks.map((item) => <Link key={item.href + item.label} href={item.href} className="block rounded-xl px-3 py-3 font-medium hover:bg-neutral-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-black">{item.label}</Link>)}
          </nav>
        </details>
        <Link href="/" aria-label="Revant — accueil" className="shrink-0">
          <Image src="/images/logo-revant.svg" alt="Revant" width={52} height={52} priority className="h-10 w-10 rounded-md object-cover sm:h-12 sm:w-12" />
        </Link>
        <nav className="hidden items-center gap-7 text-xs font-medium text-white/85 md:flex">
          <Link href="/">Accueil</Link><Link href="/boutiques">Boutiques</Link><Link href="/#categories">Catégories</Link><Link href="/restaurants">Restaurants</Link><Link href="/#a-propos">À propos</Link>
        </nav>
        <div className="flex items-center gap-1 sm:gap-4">
          <form action="/" method="get" className="hidden items-center gap-2 rounded-full border border-white/20 px-3 py-2 sm:flex"><SearchIcon/><input name="q" aria-label="Rechercher des produits" placeholder="Rechercher" className="w-24 bg-transparent text-xs text-white outline-none placeholder:text-white/50 sm:w-32"/></form>
          <PhotoActionMenu />
          <Link href="/compte" aria-label="Mon compte" className="rounded-full p-1.5 hover:bg-white/10"><UserIcon/></Link>
          <Link href="/boutiques" aria-label="Découvrir les boutiques" className="rounded-full p-1.5 hover:bg-white/10"><BagIcon/></Link>
          <details className="relative">
            <summary aria-label="Plus d’options" className="flex min-h-10 min-w-9 list-none cursor-pointer items-center justify-center rounded-full hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"><MoreIcon/></summary>
            <nav aria-label="Plus d’options" className="absolute right-0 top-11 z-50 w-60 rounded-2xl border border-black/10 bg-white p-2 text-sm text-neutral-900 shadow-2xl">
              {quickLinks.map((item) => <Link key={item.href + item.label} href={item.href} className="block rounded-xl px-3 py-3 font-medium hover:bg-neutral-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-black">{item.label}</Link>)}
            </nav>
          </details>
          <div className="hidden lg:block"><PaletteSwitcher current={palette}/></div>
        </div>
      </div>
      <div className="px-3 pb-3 sm:hidden">
        <form action="/" method="get" role="search" className="flex min-h-12 items-center gap-3 rounded-full border border-white/15 bg-white px-4 text-neutral-900 shadow-sm focus-within:ring-2 focus-within:ring-[#803e2f]">
          <SearchIcon/><input name="q" aria-label="Rechercher des produits, boutiques et catégories" placeholder="Rechercher produits, boutiques…" className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-neutral-500" />
          <button type="submit" aria-label="Lancer la recherche" className="rounded-full bg-[#803e2f] px-3 py-2 text-xs font-bold text-white">OK</button>
          <PhotoActionMenu />
        </form>
      </div>
    </header>
  );
}
