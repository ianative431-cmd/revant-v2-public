"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Store,
  ShoppingBag,
  Package,
  ClipboardList,
  Truck,
  CreditCard,
  Wallet,
  Banknote,
  Megaphone,
  Share2,
  Star,
  MessageSquare,
  MessageCircle,
  ShieldCheck,
  Settings,
  LogOut,
  type LucideIcon,
} from "lucide-react";
import { ADMIN_NAV } from "@/content/admin/nav";
import { signOutAction } from "@/app/(auth)/actions";

const NAV_ICONS: Record<string, LucideIcon> = {
  "/admin": LayoutDashboard,
  "/admin/utilisateurs": Users,
  "/admin/vendeurs": Store,
  "/admin/boutiques": ShoppingBag,
  "/admin/produits": Package,
  "/admin/commandes": ClipboardList,
  "/admin/livraisons": Truck,
  "/admin/paiements": CreditCard,
  "/admin/finance": Wallet,
  "/admin/retraits": Banknote,
  "/admin/promotions": Megaphone,
  "/admin/parrainages": Share2,
  "/admin/avis": Star,
  "/admin/messages": MessageSquare,
  "/admin/whatsapp": MessageCircle,
  "/admin/securite": ShieldCheck,
  "/admin/parametres": Settings,
};

const ROLE_LABEL: Record<string, string> = {
  super_admin: "Super administrateur",
  admin: "Administrateur",
  moderator: "Modérateur",
  finance_admin: "Administrateur finance",
  support_admin: "Support",
  kyc_admin: "Administrateur KYC",
  catalog_admin: "Administrateur catalogue",
};

export default function AdminSidebar({
  adminEmail,
  adminRole,
}: {
  /** Identité réelle de l'admin connecté (Supabase auth), jamais une donnée d'exemple. */
  adminEmail: string;
  adminRole: string;
}) {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === "/admin") return pathname === "/admin";
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <>
      {/* Mobile / tablette : rangée horizontale défilante */}
      <nav className="md:hidden bg-[#0B0B10] px-4 py-3 flex gap-2 overflow-x-auto">
        {ADMIN_NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`shrink-0 text-xs font-medium rounded-full px-4 py-2 whitespace-nowrap ${
              isActive(item.href)
                ? "bg-white text-[#0B0B10]"
                : "bg-white/5 text-white/60"
            }`}
          >
            {item.label}
            {!item.ready && <span className="ml-1 opacity-50">·</span>}
          </Link>
        ))}
      </nav>

      {/* Desktop : colonne fixe sombre */}
      <aside className="hidden md:flex md:flex-col md:w-64 md:shrink-0 md:min-h-screen md:bg-[#0B0B10] md:py-6 md:px-3">
        <Link href="/" className="flex items-center gap-2 px-3 mb-8">
          <Image src="/images/logo-revant.svg" alt="Revant" width={32} height={32} className="rounded-lg" />
          <span className="text-white font-semibold text-base" style={{ fontFamily: "Georgia, serif" }}>
            Revant
          </span>
        </Link>

        <p className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-wide text-white/30">
          Administration
        </p>
        <div className="flex-1 overflow-y-auto flex flex-col gap-0.5">
          {ADMIN_NAV.map((item) => {
            const Icon = NAV_ICONS[item.href] ?? Settings;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`text-sm rounded-xl px-3 py-2.5 flex items-center gap-2.5 transition-colors ${
                  active
                    ? "bg-white text-[#0B0B10] font-medium"
                    : "text-white/60 hover:bg-white/5 hover:text-white"
                }`}
              >
                <Icon size={17} strokeWidth={2} className="shrink-0" />
                <span className="flex-1 truncate">{item.label}</span>
                {!item.ready && !active && (
                  <span className="text-[10px] text-white/25 shrink-0">bientôt</span>
                )}
              </Link>
            );
          })}
        </div>

        {/* Identité réelle de l'admin connecté — remplace tout élément
            décoratif type "essai gratuit" : aucune fonctionnalité
            commerciale de ce genre n'existe pour un outil interne. */}
        <div className="mt-4 pt-4 border-t border-white/10 px-1">
          <div className="flex items-center gap-2.5 px-2 py-2 rounded-xl hover:bg-white/5">
            <span className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white text-xs font-semibold shrink-0">
              {adminEmail.slice(0, 1).toUpperCase()}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-white truncate">{adminEmail}</p>
              <p className="text-[10px] text-white/40 truncate">
                {ROLE_LABEL[adminRole] ?? adminRole}
              </p>
            </div>
            <form action={signOutAction}>
              <button
                type="submit"
                title="Se déconnecter"
                className="text-white/40 hover:text-white shrink-0"
              >
                <LogOut size={15} />
              </button>
            </form>
          </div>
        </div>
      </aside>
    </>
  );
}
