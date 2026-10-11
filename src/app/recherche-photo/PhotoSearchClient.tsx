"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { savePendingProductImage } from "@/lib/pending-product-image";

export default function PhotoSearchClient() {
  const router = useRouter();
  const [preview, setPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState("");
  const [handoffError, setHandoffError] = useState("");
  const [openingForm, setOpeningForm] = useState(false);

  useEffect(() => () => {
    if (preview) URL.revokeObjectURL(preview);
  }, [preview]);

  function selectPhoto(file?: File) {
    if (!file) return;
    if (preview) URL.revokeObjectURL(preview);
    setHandoffError("");
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setPreview(null);
      setSelectedFile(null);
      setFileName("Format non pris en charge. Choisis une image JPEG, PNG ou WebP.");
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setPreview(null);
      setSelectedFile(null);
      setFileName("Image trop volumineuse : maximum 8 Mo.");
      return;
    }
    setSelectedFile(file);
    setPreview(URL.createObjectURL(file));
    setFileName(file.name);
  }

  async function continueToProductForm() {
    setHandoffError("");
    if (!selectedFile) {
      router.push("/compte/boutique/produits/nouveau");
      return;
    }
    setOpeningForm(true);
    try {
      await savePendingProductImage(selectedFile);
      router.push("/compte/boutique/produits/nouveau");
    } catch {
      setHandoffError("Impossible de garder cette photo sur cet appareil. Réessaie ou sélectionne-la directement dans le formulaire.");
      setOpeningForm(false);
    }
  }

  return <>
    <h1 className="mt-5 text-2xl font-extrabold">Rechercher par photo</h1>
    <p className="mt-2 text-sm leading-6 text-neutral-600">Prends une photo avec ton téléphone ou importe une image pour préparer une recherche visuelle.</p>
    <label className="mt-6 flex min-h-48 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-neutral-300 bg-white p-6 text-center hover:border-neutral-500">
      {preview ? <>
        {/* eslint-disable-next-line @next/next/no-img-element -- aperçu local depuis une blob URL */}
        <img src={preview} alt="Aperçu de la photo sélectionnée" className="max-h-64 w-full rounded-xl object-contain" />
      </> : <><span className="text-4xl" aria-hidden="true">◎</span><span className="mt-3 font-semibold">Prendre une photo ou importer</span><span className="mt-1 text-xs text-neutral-500">JPEG, PNG ou WebP · 8 Mo maximum</span></>}
      <input type="file" accept="image/jpeg,image/png,image/webp" capture="environment" onChange={(event) => selectPhoto(event.target.files?.[0])} className="sr-only" />
    </label>
    {fileName && <p className="mt-3 break-words text-xs text-neutral-600">{fileName}</p>}
    <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950"><strong>À savoir :</strong> la recherche automatique parmi les produits n’est pas encore connectée. La photo reste sur cet appareil jusqu’à ce que tu choisisses de publier une annonce ; elle n’est pas envoyée par cette page.</div>
    {handoffError && <p role="alert" className="mt-3 text-sm text-red-700">{handoffError}</p>}
    <button type="button" onClick={continueToProductForm} disabled={openingForm} className="mt-5 flex w-full items-center justify-center rounded-xl bg-black px-4 py-3 text-sm font-semibold text-white disabled:opacity-60">{openingForm ? "Préparation…" : "Ajouter un produit à ma boutique"}</button>
  </>;
}
