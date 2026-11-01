"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { consumePendingProductImage } from "@/lib/pending-product-image";

export default function PhotoSearchPage() {
  const [photo, setPhoto] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const router = useRouter();
  useEffect(() => {
    let action: string | null = null;
    let legacyPhoto: string | null = null;
    try {
      action = sessionStorage.getItem("revant-photo-action");
      if (action !== "search") return;
      legacyPhoto = sessionStorage.getItem("revant-photo-prefill");
      sessionStorage.removeItem("revant-photo-action");
      sessionStorage.removeItem("revant-photo-prefill");
    } catch {
      return;
    }

    let active = true;
    let objectUrl: string | null = null;
    consumePendingProductImage().then((file) => {
      if (!active) return;
      if (file) {
        objectUrl = URL.createObjectURL(file);
        setPhoto(objectUrl);
      } else if (legacyPhoto) {
        setPhoto(legacyPhoto);
      }
    }).catch(() => {
      if (active && legacyPhoto) setPhoto(legacyPhoto);
    });
    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, []);
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (query.trim()) router.push(`/?q=${encodeURIComponent(query.trim())}#produits`);
  }
  return <main className="min-h-screen bg-[#f7f7f7] px-4 py-8 text-neutral-900">
    <div className="mx-auto max-w-lg rounded-2xl bg-white p-5 shadow-sm sm:p-7">
      <Link href="/" className="text-sm text-neutral-500 hover:text-black">← Retour à l’accueil</Link>
      <h1 className="mt-5 text-2xl font-black">Rechercher par photo</h1>
      <p className="mt-2 text-sm leading-relaxed text-neutral-600">Ta photo est prête. Pour l’instant, le catalogue peut être recherché par mots-clés ; la reconnaissance automatique d’images devra être reliée à un moteur visuel.</p>
      {photo ? <><span className="sr-only">Photo sélectionnée</span><img src={photo} alt="Photo sélectionnée pour la recherche" className="mt-5 max-h-72 w-full rounded-xl bg-neutral-100 object-contain" /></> : <div className="mt-5 flex h-36 items-center justify-center rounded-xl bg-neutral-100 text-sm text-neutral-500">Choisis une photo avec l’icône appareil photo de la recherche.</div>}
      <form onSubmit={submit} className="mt-5 flex gap-2">
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Décris le produit recherché" aria-label="Décrire le produit recherché" className="min-w-0 flex-1 rounded-xl border border-neutral-200 px-3 py-3 text-sm outline-none focus:border-[#803e2f]" />
        <button type="submit" className="rounded-xl bg-[#803e2f] px-4 py-3 text-sm font-bold text-white">Chercher</button>
      </form>
    </div>
  </main>;
}
