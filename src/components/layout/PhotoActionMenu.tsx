"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  PRODUCT_IMAGE_ALLOWED_TYPES,
  PRODUCT_IMAGE_MAX_BYTES,
} from "@/lib/product-image";
import { savePendingProductImage } from "@/lib/pending-product-image";

type Action = "search" | "add";

export default function PhotoActionMenu() {
  const inputRef = useRef<HTMLInputElement>(null);
  const actionRef = useRef<Action>("search");
  const [notice, setNotice] = useState("");
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  function choose(action: Action) {
    actionRef.current = action;
    setNotice("");
    if (inputRef.current) {
      inputRef.current.value = "";
      inputRef.current.click();
    }
  }

  async function onPhotoSelected(file?: File) {
    if (!file) return;
    const action = actionRef.current;

    if (action === "add") {
      if (!PRODUCT_IMAGE_ALLOWED_TYPES.includes(file.type)) {
        setNotice("Format non pris en charge. Choisis une image JPEG, PNG ou WebP.");
        return;
      }
      if (file.size > PRODUCT_IMAGE_MAX_BYTES) {
        setNotice("Image trop volumineuse. Maximum 8 Mo.");
        return;
      }
      setSaving(true);
      setNotice("");
      try {
        await savePendingProductImage(file);
        sessionStorage.setItem("revant-photo-action", "add");
        router.push("/compte/boutique/produits/nouveau?photo=1");
      } catch {
        setNotice("Impossible de préparer cette image sur cet appareil. Sélectionne-la directement dans le formulaire.");
      } finally {
        setSaving(false);
      }
      return;
    }

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
        sessionStorage.setItem("revant-photo-prefill", reader.result);
        sessionStorage.setItem("revant-photo-action", "search");
        router.push("/recherche-photo");
      } catch {
        setNotice("Impossible de préparer cette image. Essaie un fichier plus petit.");
      }
    };
    reader.onerror = () => setNotice("Impossible de lire cette image.");
    reader.readAsDataURL(file);
  }

  return (
    <div className="relative flex shrink-0 items-center gap-1">
      <button type="button" aria-label="Rechercher par photo" title="Rechercher par photo" onClick={() => choose("search")} disabled={saving} className="flex h-10 w-8 items-center justify-center text-neutral-500 transition hover:text-[#803e2f] disabled:opacity-50">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="h-5 w-5" aria-hidden="true">
          <circle cx="10.5" cy="10.5" r="6.5" />
          <path d="m15.5 15.5 5 5M8 10.5h5M10.5 8v5" strokeLinecap="round" />
        </svg>
      </button>
      <button type="button" aria-label="Ajouter un produit" title="Ajouter un produit" onClick={() => choose("add")} disabled={saving} className="flex h-10 w-8 items-center justify-center text-neutral-500 transition hover:text-[#803e2f] disabled:opacity-50">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="h-5 w-5" aria-hidden="true">
          <path d="M4 7h3l1.5-2h7L17 7h3v12H4V7Z" strokeLinejoin="round" />
          <path d="M12 9v6M9 12h6" strokeLinecap="round" />
        </svg>
      </button>
      <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(event) => onPhotoSelected(event.target.files?.[0])} />
      {saving && <p role="status" className="absolute right-0 top-11 z-[60] w-56 text-xs text-neutral-500">Préparation de la photo…</p>}
      {notice && <p role="status" className="absolute right-0 top-11 z-[60] w-56 text-xs text-red-700">{notice}</p>}
    </div>
  );
}
