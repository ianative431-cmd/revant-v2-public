import Link from "next/link";
import { getCurrentUser } from "@/server/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getShopByOwnerId } from "@/server/shops/shops";

function HomeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5">
      <path d="M3 11.5 12 4l9 7.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5.5 10v9a1 1 0 0 0 1 1H9a1 1 0 0 0 1-1v-4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v4a1 1 0 0 0 1 1h2.5a1 1 0 0 0 1-1v-9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ShopIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5">
      <path d="M4 10v9a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-9" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M3 4h18l1.5 5.5a2 2 0 0 1-2 2.5h-17a2 2 0 0 1-2-2.5L3 4Z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9 20v-5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function OrdersIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5">
      <rect x="4" y="5" width="16" height="16" rx="2" />
      <path d="M8 3v4M16 3v4M4 10h16" strokeLinecap="round" />
    </svg>
  );
}

function ProfileIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5">
      <circle cx="12" cy="8" r="3.3" />
      <path d="M5 20c1.2-3.5 4-5.3 7-5.3s5.8 1.8 7 5.3" strokeLinecap="round" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="w-5 h-5">
      <path d="M12 5v14M5 12h14" strokeLinecap="round" />
    </svg>
  );
}

function Item({ href, label, icon }: { href: string; label: string; icon: React.ReactNode }) {
  return (
    <Link href={href} className="flex flex-col items-center gap-0.5 py-2 px-3 text-brand-on-surface">
      {icon}
      <span className="text-[10px] font-medium">{label}</span>
    </Link>
  );
}

export default async function BottomNav() {
  const user = await getCurrentUser();
  let publishHref = "/boutiques/creer";

  if (user) {
    const supabase = await createSupabaseServerClient();
    const shop = await getShopByOwnerId(supabase, user.id);
    if (shop) publishHref = "/compte/boutique/produits/nouveau";
  }

  return (
    <nav className="sticky bottom-0 inset-x-0 z-40 bg-brand-surface border-t border-brand-text/10 flex items-center justify-around pb-[env(safe-area-inset-bottom,0px)]">
      <Item href="/" label="Accueil" icon={<HomeIcon />} />
      <Item href="/compte/boutique" label="Boutique" icon={<ShopIcon />} />
      <Link
        href={publishHref}
        aria-label="Publier une annonce"
        className="flex items-center justify-center w-11 h-11 rounded-full bg-brand-accent text-white -translate-y-3 shadow-md"
      >
        <PlusIcon />
      </Link>
      <Item href="/compte/commandes" label="Commandes" icon={<OrdersIcon />} />
      <Item href="/compte" label="Profil" icon={<ProfileIcon />} />
    </nav>
  );
}
