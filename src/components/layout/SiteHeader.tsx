import Link from "next/link";
import Image from "next/image";
import PaletteSwitcher from "./PaletteSwitcher";
import { getSitePalette } from "@/server/theme/site-palette";

function SearchIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5" aria-hidden="true"><circle cx="10.8" cy="10.8" r="6.8"/><path d="m16 16 4 4" strokeLinecap="round"/></svg>;
}
function CameraIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5" aria-hidden="true"><path d="M4 7.5h3l1.5-2h7l1.5 2h3v11H4z" strokeLinejoin="round"/><circle cx="12" cy="13" r="3.2"/></svg>;
}
function UserIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5" aria-hidden="true"><circle cx="12" cy="8" r="3.3"/><path d="M5 20c1.2-3.5 4-5.3 7-5.3s5.8 1.8 7 5.3" strokeLinecap="round"/></svg>;
}
function BagIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5" aria-hidden="true"><path d="M5 8h14l1 12H4L5 8Z"/><path d="M9 9V6a3 3 0 0 1 6 0v3" strokeLinecap="round"/></svg>;
}
function CameraActions() {
  return <details className="relative">
    <summary aria-label="Recherche par photo ou ajouter un produit" title="Actions photo" className="list-none cursor-pointer rounded-full p-1.5 hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"><CameraIcon/></summary>
    <div className="absolute right-0 top-10 z-50 w-64 rounded-xl border border-neutral-200 bg-white p-2 text-sm text-neutral-900 shadow-xl">
      <Link href="/recherche-photo" className="flex items-center gap-3 rounded-lg px-3 py-3 hover:bg-neutral-100"><span className="text-lg" aria-hidden="true">⌕</span><span><strong className="block text-sm">Rechercher par photo</strong><span className="text-xs text-neutral-500">Importer ou prendre une photo</span></span></Link>
      <Link href="/compte/boutique/produits/nouveau" className="flex items-center gap-3 rounded-lg px-3 py-3 hover:bg-neutral-100"><span className="text-lg" aria-hidden="true">＋</span><span><strong className="block text-sm">Ajouter un produit</strong><span className="text-xs text-neutral-500">Créer une annonce</span></span></Link>
    </div>
  </details>;
}
export default async function SiteHeader() {
  const palette = await getSitePalette();
  return <header className="sticky top-0 z-40 border-b border-white/10 bg-[#090909] text-white"><div className="mx-auto flex min-h-[68px] max-w-[1500px] items-center justify-between gap-3 px-4 sm:px-7"><Link href="/" aria-label="Revant — accueil" className="shrink-0"><Image src="/images/logo-revant.svg" alt="Revant" width={52} height={52} priority className="h-11 w-11 rounded-md object-cover sm:h-12 sm:w-12" /></Link><nav className="hidden items-center gap-7 text-xs font-medium text-white/85 md:flex"><Link href="/">Accueil</Link><Link href="/boutiques">Boutiques</Link><Link href="/#categories">Catégories</Link><Link href="/#a-propos">À propos</Link></nav><div className="flex items-center gap-3 sm:gap-4"><form action="/" method="get" className="hidden items-center gap-2 rounded-full border border-white/20 px-3 py-2 sm:flex"><SearchIcon/><input name="q" aria-label="Rechercher des produits" placeholder="Rechercher" className="w-24 bg-transparent text-xs text-white outline-none placeholder:text-white/50 sm:w-32"/></form><details className="relative sm:hidden"><summary aria-label="Ouvrir la recherche" className="list-none cursor-pointer"><SearchIcon/></summary><form action="/" method="get" className="absolute right-0 top-9 z-50 flex w-64 gap-2 rounded-xl bg-white p-3 text-black shadow-xl"><input name="q" autoFocus aria-label="Rechercher des produits" placeholder="Rechercher un produit" className="min-w-0 flex-1 outline-none"/><button type="submit" aria-label="Lancer la recherche" className="rounded-lg bg-black p-2 text-white"><SearchIcon/></button></form></details><CameraActions/><Link href="/compte" aria-label="Mon compte"><UserIcon/></Link><Link href="/boutiques" aria-label="Découvrir les boutiques"><BagIcon/></Link><div className="hidden lg:block"><PaletteSwitcher current={palette}/></div></div></div><nav className="flex gap-5 overflow-x-auto px-4 pb-3 text-xs text-white/75 md:hidden"><Link href="/">Accueil</Link><Link href="/boutiques">Boutiques</Link><Link href="/#categories">Catégories</Link><Link href="/#a-propos">À propos</Link></nav></header>;
}
