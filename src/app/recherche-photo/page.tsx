import Link from "next/link";
import SiteHeader from "@/components/layout/SiteHeader";
import BottomNav from "@/components/layout/BottomNav";
import PhotoSearchClient from "./PhotoSearchClient";

export default function RecherchePhotoPage() {
  return <div className="min-h-screen bg-[#f7f7f7] pb-24 text-[#191919]">
    <SiteHeader />
    <main className="mx-auto max-w-xl px-4 py-8">
      <Link href="/" className="text-sm text-neutral-600 underline">← Retour à l’accueil</Link>
      <PhotoSearchClient />
    </main>
    <BottomNav />
  </div>;
}
