import Image from "next/image";
import Link from "next/link";
import PaletteSwitcher from "./PaletteSwitcher";
import { getSitePalette } from "@/server/theme/site-palette";

export default async function SiteHeader() {
  const palette = await getSitePalette();

  return (
    <header className="px-4 pt-5 pb-4 flex items-center justify-between bg-brand-bg">
      <Link href="/" className="flex items-center gap-2">
        <Image src="/images/logo-revant.svg" alt="Revant" width={32} height={32} className="rounded-xl" priority />
        <span className="text-xl font-bold" style={{ fontFamily: "Georgia, serif" }}>
          Revant
        </span>
      </Link>
      <div className="flex items-center gap-4">
        <Link href="/restaurants" className="text-sm underline hidden sm:inline">
          Restaurants
        </Link>
        <Link href="/compte" className="text-sm underline">
          Mon compte
        </Link>
        <PaletteSwitcher current={palette} />
      </div>
    </header>
  );
}
