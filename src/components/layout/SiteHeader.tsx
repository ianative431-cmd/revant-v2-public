import Image from "next/image";
import Link from "next/link";
import PaletteSwitcher from "./PaletteSwitcher";
import { getSitePalette } from "@/server/theme/site-palette";

export default async function SiteHeader() {
  const palette = await getSitePalette();

  return (
    <header className="bg-white text-[#18372d] shadow-sm">
      <div className="mx-auto flex max-w-[1600px] flex-wrap items-center gap-3 px-4 py-3 lg:flex-nowrap lg:px-7">
        <Link href="/" className="flex shrink-0 items-center gap-2" aria-label="Revant, accueil">
          <Image src="/images/logo-revant.svg" alt="Revant" width={42} height={42} className="rounded-xl" priority />
          <span className="leading-tight">
            <strong className="block text-xl font-extrabold tracking-tight">Revant</strong>
            <span className="block text-[10px] text-neutral-500">Achetez · Vendez · Grandissez</span>
          </span>
        </Link>

        <form action="/" method="get" role="search" className="order-3 flex w-full min-w-0 overflow-hidden rounded-full border border-neutral-200 bg-neutral-50 lg:order-none lg:mx-5 lg:flex-1">
          <label htmlFor="revant-search" className="sr-only">Rechercher un produit ou une catégorie</label>
          <input id="revant-search" name="q" type="search" placeholder="Rechercher un produit, une boutique, une marque..." className="min-w-0 flex-1 bg-transparent px-4 py-3 text-sm text-neutral-900 outline-none" />
          <button type="submit" aria-label="Rechercher" className="bg-[#07543d] px-5 text-white transition hover:bg-[#063f2f]">⌕</button>
        </form>

        <div className="ml-auto flex items-center gap-3 text-xs sm:gap-4 sm:text-sm">
          <span className="hidden items-center gap-1 whitespace-nowrap md:flex">⌖ Niamey</span>
          <Link href="/compte" className="whitespace-nowrap hover:text-[#07834f]">♡ <span className="hidden sm:inline">Favoris</span></Link>
          <Link href="/compte" className="whitespace-nowrap hover:text-[#07834f]">🛒 <span className="hidden sm:inline">Panier</span></Link>
          <Link href="/compte" className="whitespace-nowrap font-semibold hover:text-[#07834f]">Mon compte</Link>
          <div className="hidden sm:block"><PaletteSwitcher current={palette} /></div>
        </div>
      </div>

      <nav aria-label="Navigation principale" className="overflow-x-auto bg-[#064b38] text-white">
        <div className="mx-auto flex min-w-max max-w-[1600px] items-center gap-1 px-3 py-1.5 lg:px-6">
          <Link href="/#categories" className="rounded-md px-3 py-2 text-xs font-semibold hover:bg-white/10">☰ Toutes les catégories</Link>
          <Link href="/" className="rounded-md border-b-2 border-lime-400 px-3 py-2 text-xs font-semibold">Accueil</Link>
          <Link href="/#boutiques" className="rounded-md px-3 py-2 text-xs hover:bg-white/10">Boutiques</Link>
          <Link href="/#promotions" className="rounded-md px-3 py-2 text-xs hover:bg-white/10">Promotions</Link>
          <Link href="/#produits" className="rounded-md px-3 py-2 text-xs hover:bg-white/10">Nouveautés</Link>
          <Link href="/restaurants" className="rounded-md px-3 py-2 text-xs hover:bg-white/10">Restaurants</Link>
          <Link href="/#livraison" className="rounded-md px-3 py-2 text-xs hover:bg-white/10">Livraison</Link>
          <Link href="/#marques" className="rounded-md px-3 py-2 text-xs hover:bg-white/10">Marques</Link>
        </div>
      </nav>
    </header>
  );
}
