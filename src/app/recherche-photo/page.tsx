"use client";

import Link from "next/link";
import { useState } from "react";
import SiteHeader from "@/components/layout/SiteHeader";
import BottomNav from "@/components/layout/BottomNav";

export default function RecherchePhotoPage() {
  const [preview, setPreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState("");

  function selectPhoto(file?: File) {
    if (!file) return;
    if (!(["image/jpeg", "image/png", "image/webp"].includes(file.type))) {
      setPreview(null);
      setFileName("Format non pris en charge. Choisis une image JPEG, PNG ou WebP.");
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setPreview(null);
      setFileName("Image trop volumineuse : maximum 8 Mo.");
      return;
    }
    setPreview((old) => {
      if (old) URL.revokeObjectURL(old);
      return URL.createObjectURL(file);
    });
    setFileName(file.name);
  }

  return <div className="min-h-screen bg-[#f7f7f7] pb-24 text-[#191919]">
    <SiteHeader />
    <main className="mx-auto max-w-xl px-4 py-8">
      <Link href="/" className="text-sm text-neutral-600 underline">← Retour à l’accueil</Link>
      <h1 className="mt-5 text-2xl font-extrabold">Rechercher par photo</h1>
      <p className="mt-2 text-sm leading-6 text-neutral-600">Prends une photo avec ton téléphone ou importe une image pour préparer une recherche visuelle.</p>
      <label className="mt-6 flex min-h-48 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-neutral-300 bg-white p-6 text-center hover:border-neutral-500">
        {preview ? <img src={preview} alt="Aperçu de la photo sélectionnée" className="max-h-64 w-full rounded-xl object-contain" /> : <><span className="text-4xl" aria-hidden="true">◎</span><span className="mt-3 font-semibold">Prendre une photo ou importer</span><span className="mt-1 text-xs text-neutral-500">JPEG, PNG ou WebP · 8 Mo maximum</span></>}
        <input type="file" accept="image/jpeg,image/png,image/webp" capture="environment" onChange={(event) => selectPhoto(event.target.files?.[0])} className="sr-only" />
      </label>
      {fileName && <p className="mt-3 break-words text-xs text-neutral-600">{fileName}</p>}
      <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950"><strong>À savoir :</strong> le moteur qui compare cette image aux produits du catalogue n’est pas encore connecté. Pour l’instant, l’image reste sur ton appareil et n’est ni envoyée ni publiée.</div>
      <Link href="/compte/boutique/produits/nouveau" className="mt-5 flex w-full items-center justify-center rounded-xl bg-black px-4 py-3 text-sm font-semibold text-white">Ajouter un produit à ma boutique</Link>
    </main>
    <BottomNav />
  </div>;
}
