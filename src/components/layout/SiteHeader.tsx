import Image from "next/image";
import Link from "next/link";
import PaletteSwitcher from "./PaletteSwitcher";
import { getSitePalette } from "@/server/theme/site-palette";

function PinIcon() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-3.5 w-3.5"><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/></svg>; }
function TruckIcon() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-3.5 w-3.5"><path d="M3 6h11v11H3zM14 10h4l3 3v4h-7z"/><circle cx="7" cy="18" r="2"/><circle cx="18" cy="18" r="2"/></svg>; }
function SearchIcon() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5"><circle cx="10.8" cy="10.8" r="6.8"/><path d="m16 16 5 5" strokeLinecap="round"/></svg>; }
function UserIcon() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5"><circle cx="12" cy="8" r="3.4"/><path d="M5 20c1.2-3.5 4-5.2 7-5.2s5.8 1.7 7 5.2" strokeLinecap="round"/></svg>; }
function CartIcon() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5"><path d="M3 4h2l2.2 11.2a2 2 0 0 0 2 1.6h8.5a2 2 0 0 0 2-1.6L21 8H6" strokeLinecap="round" strokeLinejoin="round"/><circle cx="10" cy="20" r="1.3"/><circle cx="18" cy="20" r="1.3"/></svg>; }

export default async function SiteHeader() {
  const palette = await getSitePalette();
  return (
    <header className="bg-white text-[#111827] shadow-sm">
      <div className="hidden bg-[#080d18] text-white sm:block">
        <div className="mx-auto flex max-w-[1500px] items-center justify-between gap-4 px-5 py-2 text-[11px] text-white/85">
          <span className="flex items-center gap-2"><PinIcon /> Niamey, Niger</span>
          <Link href="/livraison" className="flex items-center gap-2 hover:text-[#f47b20]"><TruckIcon /> Livraison selon les boutiques et commandes</Link>
          <Link href="/contact" className="hover:text-[#f47b20]">Assistance Revant</Link>
          <div className="flex gap-3 text-sm" aria-label="Réseaux sociaux"><a href="https://www.facebook.com/" aria-label="Facebook" className="hover:text-[#f47b20]">f</a><a href="https://www.instagram.com/" aria-label="Instagram" className="hover:text-[#f47b20]">◎</a><a href="https://www.youtube.com/" aria-label="YouTube" className="hover:text-[#f47b20]">▶</a></div>
        </div>
      </div>
      <div className="mx-auto flex max-w-[1500px] flex-wrap items-center gap-3 px-4 py-4 lg:flex-nowrap lg:px-7">
        <Link href="/" className="flex shrink-0 items-center gap-2" aria-label="Revant, accueil">
          <Image src="/images/logo-revant.svg" alt="Revant" width={43} height={43} priority />
          <span className="leading-tight"><strong className="block text-xl font-extrabold tracking-tight">Revant</strong><span className="block text-[9px] uppercase tracking-wider text-neutral-500">Achetez · Vendez · Grandissez</span></span>
        </Link>
        <form action="/" method="get" role="search" className="order-3 flex w-full min-w-0 overflow-hidden rounded-md border border-neutral-200 bg-white lg:order-none lg:mx-7 lg:flex-1">
          <label htmlFor="revant-search" className="sr-only">Rechercher un produit, une boutique ou une marque</label>
          <input id="revant-search" name="q" type="search" placeholder="Rechercher des produits, boutiques, marques..." className="min-w-0 flex-1 bg-transparent px-4 py-3 text-sm outline-none" />
          <button type="submit" aria-label="Rechercher" className="flex items-center justify-center bg-[#f47b20] px-5 text-white transition hover:bg-[#dd6412]"><SearchIcon /></button>
        </form>
        <div className="ml-auto flex items-center gap-4">
          <Link href="/compte" aria-label="Mon compte" className="flex flex-col items-center gap-1 text-[#172033] hover:text-[#f47b20]"><UserIcon /><span className="hidden text-[10px] sm:block">Compte</span></Link>
          <Link href="/compte" aria-label="Favoris" className="flex flex-col items-center gap-1 text-[#172033] hover:text-[#f47b20]"><span className="text-xl leading-5">♡</span><span className="hidden text-[10px] sm:block">Favoris</span></Link>
          <Link href="/compte" aria-label="Panier et commandes" className="flex flex-col items-center gap-1 text-[#172033] hover:text-[#f47b20]"><CartIcon /><span className="hidden text-[10px] sm:block">Panier</span></Link>
          <div className="hidden sm:block"><PaletteSwitcher current={palette} /></div>
        </div>
      </div>
      <nav aria-label="Navigation principale" className="border-y border-neutral-100 bg-white">
        <div className="mx-auto flex min-w-max max-w-[1500px] items-center gap-1 overflow-x-auto px-4 lg:px-7">
          <Link href="/" className="border-b-2 border-[#f47b20] px-4 py-3 text-xs font-bold text-[#f47b20]">ACCUEIL</Link>
          <Link href="/#produits" className="px-4 py-3 text-xs font-semibold hover:text-[#f47b20]">BOUTIQUE</Link>
          <Link href="/marques" className="px-4 py-3 text-xs font-semibold hover:text-[#f47b20]">MARQUES</Link>
          <Link href="/#categories" className="px-4 py-3 text-xs font-semibold hover:text-[#f47b20]">CATÉGORIES</Link>
          <Link href="/#promotions" className="px-4 py-3 text-xs font-semibold hover:text-[#f47b20]">PROMOTIONS</Link>
          <Link href="/boutiques" className="px-4 py-3 text-xs font-semibold hover:text-[#f47b20]">BOUTIQUES</Link>
          <Link href="/restaurants" className="px-4 py-3 text-xs font-semibold hover:text-[#f47b20]">RESTAURANTS</Link>
          <Link href="/livraison" className="px-4 py-3 text-xs font-semibold hover:text-[#f47b20]">LIVRAISON</Link>
        </div>
      </nav>
    </header>
  );
}
