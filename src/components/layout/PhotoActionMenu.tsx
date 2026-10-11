"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

type Action = "search" | "add";

export default function PhotoActionMenu() {
  const inputRef = useRef<HTMLInputElement>(null);
  const actionRef = useRef<Action>("search");
  const [notice, setNotice] = useState("");
  const router = useRouter();

  function choose(action: Action) {
    actionRef.current = action;
    setNotice("");
    if (inputRef.current) {
      inputRef.current.value = "";
      inputRef.current.click();
    }
  }

  function onPhotoSelected(file?: File) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setNotice("Choisis un fichier image.");
      return;
    }
    if (file.size > 4 * 1024 * 1024) {
      setNotice("Image trop volumineuse. Choisis une image de 4 Mo maximum.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== "string") return;
      try {
        const action = actionRef.current;
        sessionStorage.setItem("revant-photo-prefill", reader.result);
        sessionStorage.setItem("revant-photo-action", action);
        if (action === "add") router.push("/compte/boutique/produits/nouveau?photo=1");
        else router.push("/recherche-photo");
      } catch {
        setNotice("Impossible de préparer cette image. Essaie un fichier plus petit.");
      }
    };
    reader.readAsDataURL(file);
  }

  return (
    <div className="relative flex shrink-0 items-center gap-1">
      <button type="button" aria-label="Rechercher par photo" title="Rechercher par photo" onClick={() => choose("search")} className="flex h-10 w-8 items-center justify-center text-neutral-500 transition hover:text-[#803e2f]">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="h-5 w-5" aria-hidden="true">
          <circle cx="10.5" cy="10.5" r="6.5" />
          <path d="m15.5 15.5 5 5M8 10.5h5M10.5 8v5" strokeLinecap="round" />
        </svg>
      </button>
      <button type="button" aria-label="Ajouter un produit" title="Ajouter un produit" onClick={() => choose("add")} className="flex h-10 w-8 items-center justify-center text-neutral-500 transition hover:text-[#803e2f]">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="h-5 w-5" aria-hidden="true">
          <path d="M4 7h3l1.5-2h7L17 7h3v12H4V7Z" strokeLinejoin="round" />
          <path d="M12 9v6M9 12h6" strokeLinecap="round" />
        </svg>
      </button>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={(event) => onPhotoSelected(event.target.files?.[0])} />
      {notice && <p role="status" className="absolute right-0 top-11 z-[60] w-56 text-xs text-red-700">{notice}</p>}
    </div>
  );
}
