"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

type Action = "search" | "add";

export default function PhotoActionMenu() {
  const [open, setOpen] = useState(false);
  const [action, setAction] = useState<Action>("search");
  const [notice, setNotice] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  function choose(nextAction: Action) {
    setAction(nextAction);
    setNotice("");
    if (inputRef.current) inputRef.current.value = "";
    inputRef.current?.click();
  }

  function onPhotoSelected(file?: File) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setNotice("Choisis un fichier image.");
      return;
    }
    // Keep the transfer small and session-scoped; never publish on import.
    if (file.size > 4 * 1024 * 1024) {
      setNotice("Image trop volumineuse. Choisis une image de 4 Mo maximum.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== "string") return;
      try {
        sessionStorage.setItem("revant-photo-prefill", reader.result);
        sessionStorage.setItem("revant-photo-action", action);
        setOpen(false);
        if (action === "add") router.push("/compte/boutique/produits/nouveau?photo=1");
        else router.push("/recherche-photo");
      } catch {
        setNotice("Impossible de préparer cette image. Essaie un fichier plus petit.");
      }
    };
    reader.readAsDataURL(file);
  }

  return <div className="relative shrink-0">
    <button type="button" aria-label="Recherche par photo ou ajout d’un produit" aria-expanded={open} onClick={() => { setOpen((value) => !value); setNotice(""); }} className="flex h-9 w-9 items-center justify-center text-neutral-500 transition hover:text-[#803e2f] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#803e2f]" title="Recherche par photo ou ajouter un produit">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="h-[19px] w-[19px]" aria-hidden="true"><path d="M4 7h3l1.5-2h7L17 7h3v12H4V7Z" strokeLinejoin="round"/><circle cx="12" cy="13" r="3.5"/><path d="M18 9h.01"/></svg>
    </button>
    <input ref={inputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(event) => onPhotoSelected(event.target.files?.[0])} />
    {open && <div className="absolute right-0 top-11 z-[60] w-56 rounded-xl border border-black/10 bg-white p-3 text-neutral-900 shadow-xl">
      <button type="button" onClick={() => choose("search")} className="flex w-full items-center gap-3 rounded-lg px-2 py-3 text-left text-xs font-medium hover:bg-neutral-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#803e2f]"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="h-5 w-5 shrink-0"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m15.5 15.5 5 5M8 10.5h5M10.5 8v5" strokeLinecap="round"/></svg><span>Rechercher par photo</span></button>
      <button type="button" onClick={() => choose("add")} className="flex w-full items-center gap-3 rounded-lg px-2 py-3 text-left text-xs font-medium hover:bg-neutral-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#803e2f]"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="h-5 w-5 shrink-0"><path d="M4 7h3l1.5-2h7L17 7h3v12H4V7Z" strokeLinejoin="round"/><path d="M12 9v6M9 12h6" strokeLinecap="round"/></svg><span>Ajouter un produit</span></button>
      {notice && <p role="status" className="px-2 pb-1 text-[11px] text-red-700">{notice}</p>}
    </div>}
  </div>;
}
