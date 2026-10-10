import Image from "next/image";
import Link from "next/link";
import ManageCookiesButton from "@/components/cookie-consent/ManageCookiesButton";

const linkClass = "block py-1 text-[11px] text-white/65 transition hover:text-[#f47b20]";

export default function Footer() {
  return (
    <footer className="mt-8 bg-[#080d18] text-white">
      <div className="border-b border-white/10">
        <div className="mx-auto flex max-w-[1500px] flex-col gap-2 px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div><p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#f47b20]">Restez informé</p><h2 className="mt-1 text-base font-bold">Les nouveautés de Revant</h2><p className="mt-1 text-[11px] text-white/60">Retrouvez les nouvelles boutiques et les produits récemment publiés.</p></div>
          <Link href="/#produits" className="inline-flex w-fit items-center rounded-md bg-[#f47b20] px-4 py-3 text-[10px] font-extrabold text-white hover:bg-[#df6815]">DÉCOUVRIR LES PRODUITS →</Link>
        </div>
      </div>
      <div className="mx-auto grid max-w-[1500px] grid-cols-2 gap-7 px-5 py-8 sm:grid-cols-3 lg:grid-cols-5">
        <div className="col-span-2 sm:col-span-1">
          <Link href="/" className="mb-3 inline-flex items-center gap-2">
            <Image src="/images/logo-revant.svg" alt="Revant" width={38} height={38} />
            <span><strong className="block text-lg font-extrabold">Revant</strong><span className="block text-[9px] uppercase tracking-wider text-white/50">Achetez · Vendez · Grandissez</span></span>
          </Link>
          <p className="max-w-xs text-[11px] leading-relaxed text-white/60">La marketplace pour découvrir des produits, des boutiques et des vendeurs au Niger.</p>
          <div className="mt-4 flex gap-3 text-sm text-white/70"><a href="https://www.facebook.com/" aria-label="Facebook" className="hover:text-[#f47b20]">f</a><a href="https://www.instagram.com/" aria-label="Instagram" className="hover:text-[#f47b20]">◎</a><a href="https://www.youtube.com/" aria-label="YouTube" className="hover:text-[#f47b20]">▶</a></div>
        </div>
        <div><h3 className="mb-2 text-[11px] font-extrabold uppercase tracking-wide">Liens rapides</h3><Link className={linkClass} href="/">Accueil</Link><Link className={linkClass} href="/#produits">Produits</Link><Link className={linkClass} href="/boutiques">Boutiques</Link><Link className={linkClass} href="/marques">Marques</Link><Link className={linkClass} href="/#promotions">Promotions</Link></div>
        <div><h3 className="mb-2 text-[11px] font-extrabold uppercase tracking-wide">Service client</h3><Link className={linkClass} href="/compte">Mon compte</Link><Link className={linkClass} href="/compte/commandes">Mes commandes</Link><Link className={linkClass} href="/livraison">Livraison</Link><Link className={linkClass} href="/restaurants">Restaurants</Link><a className={linkClass} href="mailto:ianative431@gmail.com">Nous contacter</a></div>
        <div><h3 className="mb-2 text-[11px] font-extrabold uppercase tracking-wide">Informations légales</h3><Link className={linkClass} href="/legal">Centre juridique</Link><Link className={linkClass} href="/legal/cgu">Conditions d’utilisation</Link><Link className={linkClass} href="/legal/confidentialite">Confidentialité</Link><Link className={linkClass} href="/legal/cookies">Cookies</Link><Link className={linkClass} href="/legal/mentions-legales">Mentions légales</Link><Link className={linkClass} href="/legal/remboursement-annulation">Remboursement</Link><div className="mt-2 text-[11px] text-white/65"><ManageCookiesButton /></div></div>
      </div>
      <div className="border-t border-white/10"><div className="mx-auto flex max-w-[1500px] flex-col gap-2 px-5 py-4 text-[10px] text-white/45 sm:flex-row sm:items-center sm:justify-between"><span>© {new Date().getFullYear()} Revant. Tous droits réservés.</span><span>Marketplace indépendante · Niger</span></div></div>
    </footer>
  );
}
