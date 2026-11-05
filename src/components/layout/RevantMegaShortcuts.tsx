import Link from "next/link";
import { Shirt, FlaskConical, ShoppingBag, House, Smartphone, Store, Leaf, Utensils } from "lucide-react";

const shortcuts = [
  { label: "Mode", href: "/?categorie=mode#produits", icon: Shirt },
  { label: "Parfums", href: "/?categorie=parfums#produits", icon: FlaskConical },
  { label: "Accessoires", href: "/?categorie=sacs-accessoires#produits", icon: ShoppingBag },
  { label: "Maison", href: "/maison", icon: House },
  { label: "Électronique", href: "/?categorie=electronique#produits", icon: Smartphone },
  { label: "Boutiques", href: "/boutiques", icon: Store },
  { label: "Terroir", href: "/#boutiques-paysannes", icon: Leaf },
  { label: "Restaurants", href: "/restaurants", icon: Utensils },
];

export default function RevantMegaShortcuts() {
  return <section aria-label="Explorer Revant Mega" className="px-2 pb-2 pt-5 sm:px-4 sm:pt-7">
    <div className="mb-3 flex items-center justify-between px-2">
      <h2 className="text-base font-extrabold sm:text-lg">Explorer Revant Mega</h2>
      <Link href="/boutiques" className="text-xs font-semibold text-[#803e2f] underline-offset-4 hover:underline">Tout explorer →</Link>
    </div>
    <div className="flex gap-3 overflow-x-auto px-1 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {shortcuts.map(({ label, href, icon: Icon }) => <Link key={label} href={href} className="group flex w-[76px] shrink-0 flex-col items-center gap-2 rounded-2xl px-1 py-2 text-center focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#803e2f] sm:w-[92px]">
        <span className="flex h-14 w-14 items-center justify-center rounded-full border border-black/10 bg-white text-[#3e3d38] shadow-sm transition group-hover:border-[#803e2f] group-hover:bg-[#803e2f] group-hover:text-white group-active:scale-95 sm:h-16 sm:w-16">
          <Icon size={24} strokeWidth={1.65} aria-hidden />
        </span>
        <span className="text-[11px] font-semibold leading-tight text-neutral-800 sm:text-xs">{label}</span>
      </Link>)}
    </div>
  </section>;
}
