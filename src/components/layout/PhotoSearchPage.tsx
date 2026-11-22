"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

export default function PhotoSearchPage() {
  const [photo, setPhoto] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const router = useRouter();
  useEffect(() => {
    if (sessionStorage.getItem("revant-photo-action") !== "search") return;
    const selectedPhoto = sessionStorage.getItem("revant-photo-prefill");
    sessionStorage.removeItem("revant-photo-action");
    sessionStorage.removeItem("revant-photo-prefill");
    const timer = window.setTimeout(() => setPhoto(selectedPhoto), 0);
    return () => window.clearTimeout(timer);
  }, []);
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (query.trim()) router.push(`/?q=${encodeURIComponent(query.trim())}#produits`);
  }
  return <main className="revant-photo-search-page min-h-screen bg-brand-bg px-4 py-8 text-brand-text">
    <div className="revant-photo-search-panel mx-auto max-w-lg rounded-2xl border border-brand-border bg-brand-surface p-5 shadow-sm sm:p-7">
      <Link href="/" className="text-sm text-brand-muted hover:text-brand-text">← Retour à l’accueil</Link>
      <h1 className="mt-5 text-2xl font-black">Rechercher par photo</h1>
      <p className="mt-2 text-sm leading-relaxed text-brand-muted">{photo ? "Ta photo est prête. La reconnaissance automatique d’images n’est pas encore activée ; décris le produit par mots-clés pour lancer la recherche." : "Choisis une photo depuis l’icône appareil photo. La reconnaissance automatique d’images n’est pas encore activée ; tu peux aussi décrire le produit par mots-clés."}</p>
      {photo ? <><span className="sr-only">Photo sélectionnée</span><Image src={photo} alt="Photo sélectionnée pour la recherche" width={640} height={480} unoptimized className="revant-photo-preview mt-5 max-h-72 w-full rounded-xl bg-neutral-100 object-contain" /></> : <div className="mt-5 flex h-36 items-center justify-center rounded-xl bg-brand-bg text-sm text-brand-muted">Choisis une photo avec l’icône appareil photo de la recherche.</div>}
      <form onSubmit={submit} className="mt-5 flex gap-2">
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Décris le produit recherché" aria-label="Décrire le produit recherché" className="min-w-0 flex-1 rounded-xl border border-brand-border bg-brand-bg px-3 py-3 text-sm text-brand-text outline-none placeholder:text-brand-muted focus:border-[var(--brand-accent)]" />
        <button type="submit" className="rounded-xl bg-[var(--brand-accent)] px-4 py-3 text-sm font-bold text-white">Chercher</button>
      </form>
    </div>
  </main>;
}
