import Link from "next/link";

function HomeIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5"><path d="M3 11.5 12 4l9 7.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M5.5 10v9a1 1 0 0 0 1 1H9a1 1 0 0 0 1-1v-4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v4a1 1 0 0 0 1 1h2.5a1 1 0 0 0 1-1v-9" strokeLinecap="round" strokeLinejoin="round"/></svg>;
}
function CategoryIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65" className="h-[18px] w-[18px]" aria-hidden="true"><rect x="3.5" y="3.5" width="6.5" height="6.5" rx="1"/><rect x="14" y="3.5" width="6.5" height="6.5" rx="1"/><rect x="3.5" y="14" width="6.5" height="6.5" rx="1"/><rect x="14" y="14" width="6.5" height="6.5" rx="1"/></svg>;
}
function MessageIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65" className="h-[18px] w-[18px]" aria-hidden="true"><path d="M20 11.5a7.5 7.5 0 0 1-7.5 7.5H6l-3 2v-9.5A7.5 7.5 0 0 1 10.5 4H12a8 8 0 0 1 8 7.5Z" strokeLinecap="round" strokeLinejoin="round"/><path d="M7.5 11h9M7.5 14.5h6" strokeLinecap="round"/></svg>;
}
function CartIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65" className="h-[18px] w-[18px]" aria-hidden="true"><path d="M3 4h2l2.2 11.2a2 2 0 0 0 2 1.6h7.9a2 2 0 0 0 1.9-1.4L21 8H6" strokeLinecap="round" strokeLinejoin="round"/><circle cx="9.5" cy="20" r="1"/><circle cx="17.5" cy="20" r="1"/></svg>;
}
function ProfileIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5"><circle cx="12" cy="8" r="3.3"/><path d="M5 20c1.2-3.5 4-5.3 7-5.3s5.8 1.8 7 5.3" strokeLinecap="round"/></svg>;
}
function Item({ href, label, icon }: { href: string; label: string; icon: React.ReactNode }) {
  return <Link href={href} className="group flex min-w-0 flex-1 flex-col items-center justify-center gap-1 py-2 text-neutral-400 transition-colors hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"><span className="transition-colors group-hover:text-[#8fcf9b]">{icon}</span><span className="text-[9px] font-medium tracking-[.01em]">{label}</span></Link>;
}
export default function BottomNav() {
  return (
    <nav aria-label="Navigation principale" className="fixed inset-x-0 bottom-0 z-50 mx-auto flex w-full max-w-5xl items-stretch justify-around border-t border-white/10 bg-[#101010]/95 px-2 pb-[env(safe-area-inset-bottom,0px)] text-white shadow-[0_-6px_24px_rgba(0,0,0,.10)] backdrop-blur-md">
      <Item href="/" label="Accueil" icon={<HomeIcon/>}/>
      <Item href="/#categories" label="Catégorie" icon={<CategoryIcon/>}/>
      <Item href="/messages" label="Message" icon={<MessageIcon/>}/>
      <Item href="/panier" label="Panier" icon={<CartIcon/>}/>
      <Item href="/compte" label="Mon Revant" icon={<ProfileIcon/>}/>
    </nav>
  );
}
