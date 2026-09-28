"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ADMIN_NAV } from "@/content/admin/nav";

export default function AdminSidebar() {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === "/admin") return pathname === "/admin";
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <>
      {/* Mobile / tablette : rangée horizontale défilante */}
      <nav className="md:hidden px-4 pb-3 flex gap-2 overflow-x-auto">
        {ADMIN_NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`shrink-0 text-xs font-medium rounded-full px-4 py-2 whitespace-nowrap ${
              isActive(item.href) ? "bg-black text-white" : "bg-black/5 text-black/70"
            }`}
          >
            {item.label}
            {!item.ready && <span className="ml-1 opacity-50">·</span>}
          </Link>
        ))}
      </nav>

      {/* Desktop : colonne fixe */}
      <aside className="hidden md:flex md:flex-col md:w-56 md:shrink-0 md:min-h-screen md:border-r md:border-black/10 md:py-6 md:px-3">
        <Link href="/" className="px-3 mb-6 text-lg font-bold" style={{ fontFamily: "Georgia, serif" }}>
          Revant
        </Link>
        <p className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-wide text-black/40">
          Administration
        </p>
        <div className="flex flex-col gap-0.5">
          {ADMIN_NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`text-sm rounded-xl px-3 py-2 flex items-center justify-between ${
                isActive(item.href) ? "bg-black text-white font-medium" : "text-black/70 hover:bg-black/5"
              }`}
            >
              <span>{item.label}</span>
              {!item.ready && !isActive(item.href) && (
                <span className="text-[10px] text-black/30">bientôt</span>
              )}
            </Link>
          ))}
        </div>
      </aside>
    </>
  );
}
