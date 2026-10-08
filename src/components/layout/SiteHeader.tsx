import Link from "next/link";
import PaletteSwitcher from "./PaletteSwitcher";
import { getSitePalette } from "@/server/theme/site-palette";

export default async function SiteHeader() {
  const palette = await getSitePalette();

  return (
    <header className="px-4 pt-5 pb-4 flex items-center justify-between bg-brand-bg">
      <Link href="/" className="text-xl font-bold" style={{ fontFamily: "Georgia, serif" }}>
        Revant
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
