import Link from "next/link";
import { getCurrentUser } from "@/server/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getShopByOwnerId } from "@/server/shops/shops";

function HomeIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5"><path d="M3 11.5 12 4l9 7.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M5.5 10v9a1 1 0 0 0 1 1H9a1 1 0 0 0 1-1v-4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v4a1 1 0 0 0 1 1h2.5a1 1 0 0 0 1-1v-9" strokeLinecap="round" strokeLinejoin="round"/></svg>;
}
function ShopIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5"><path d="M4 10v9a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-9" strokeLinecap="round" strokeLinejoin="round"/><path d="M3 4h18l1.5 5.5a2 2 0 0 1-2 2.5h-17a2 2 0 0 1-2-2.5L3 4Z" strokeLinecap="round" strokeLinejoin="round"/><path d="M9 20v-5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v5"/></svg>;
}
function WalletIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5"><rect x="3" y="6" width="18" height="14" rx="2"/><path d="M16 14h5M6 6V4a1 1 0 0 1 1-1h12" strokeLinecap="round"/></svg>;
}
function ProfileIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5"><circle cx="12" cy="8" r="3.3"/><path d="M5 20c1.2-3.5 4-5.3 7-5.3s5.8 1.8 7 5.3" strokeLinecap="round"/></svg>;
}
function PlusIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="h-5 w-5"><path d="M12 5v14M5 12h14" strokeLinecap="round"/></svg>;
}
function Item({ href, label, icon }: { href: string; label: string; icon: React.ReactNode }) {
  return <Link href={href} className="flex min-w-0 flex-1 flex-col items-center gap-1 py-2 text-white"><span>{icon}</span><span className="text-[10px] font-medium">{label}</span></Link>;
}
export default async function BottomNav() {
  const user = await getCurrentUser();
  let publishHref = "/boutiques/creer";
  let shopHref = "/boutiques";
  let shopLabel = "Boutiques";
  if (user) {
    const supabase = await createSupabaseServerClient();
    const shop = await getShopByOwnerId(supabase, user.id);
    if (shop) {
      publishHref = "/compte/boutique/produits/nouveau";
      shopHref = "/compte/boutique";
      shopLabel = "Ma boutique";
    }
  }
  return (
    <nav aria-label="Navigation principale" className="fixed inset-x-3 bottom-3 z-50 mx-auto flex max-w-5xl items-center justify-around rounded-full bg-black px-2 pb-[env(safe-area-inset-bottom,0px)] shadow-2xl">
      <Item href="/" label="Accueil" icon={<HomeIcon/>}/>
      <Item href={shopHref} label={shopLabel} icon={<ShopIcon/>}/>
      <Link href={publishHref} aria-label="Publier une annonce" className="relative -mt-6 mx-1 flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white text-black shadow-lg ring-4 ring-[#f7f7f7]"><PlusIcon/></Link>
      <Item href="/compte/commandes" label="Commandes" icon={<WalletIcon/>}/>
      <Item href="/compte" label="Profil" icon={<ProfileIcon/>}/>
    </nav>
  );
}
