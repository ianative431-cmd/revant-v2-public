"use client";

import { useCallback, useRef, useState, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import {
  PRODUCT_IMAGE_ALLOWED_TYPES,
  PRODUCT_IMAGE_MAX_BYTES,
} from "@/lib/product-image";
import { savePendingProductImage } from "@/lib/pending-product-image";
import { useDismissOnOutside } from "@/hooks/useDismissOnOutside";

type Action = "search" | "add";
type PickerSource = "camera" | "gallery";

export default function PhotoActionMenu({ allowAdd = false }: { allowAdd?: boolean }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const actionRef = useRef<Action>("search");
  const [pickerAction, setPickerAction] = useState<Action | null>(null);
  const [notice, setNotice] = useState("");
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  const closeFloatingPanel = useCallback(() => {
    setPickerAction(null);
    setNotice("");
  }, []);

  const restoreTriggerFocus = useCallback(() => {
    closeFloatingPanel();
    rootRef.current
      ?.querySelector<HTMLButtonElement>('button[aria-label="Rechercher par photo"]')
      ?.focus();
  }, [closeFloatingPanel]);

  useDismissOnOutside(
    rootRef,
    closeFloatingPanel,
    Boolean(pickerAction || notice),
    restoreTriggerFocus,
  );

  function choose(action: Action) {
    actionRef.current = action;
    setNotice("");
    setPickerAction(action);
  }

  function openPicker(source: PickerSource) {
    setPickerAction(null);
    const input = source === "camera" ? cameraInputRef.current : galleryInputRef.current;
    if (!input) return;
    input.value = "";
    input.click();
  }

  async function onPhotoSelected(file?: File) {
    if (!file) return;
    const action = actionRef.current;

    if (action === "add") {
      if (!allowAdd) return;
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

  function handleInputChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = "";
    void onPhotoSelected(file);
  }

  return (
    <div ref={rootRef} className="relative flex shrink-0 items-center gap-1">
      <button type="button" aria-label="Rechercher par photo" title="Rechercher par photo" onClick={() => choose("search")} disabled={saving} className="flex h-10 w-8 items-center justify-center text-neutral-500 transition hover:text-[var(--brand-accent)] disabled:opacity-50">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="h-5 w-5" aria-hidden="true">
          <circle cx="10.5" cy="10.5" r="6.5" />
          <path d="m15.5 15.5 5 5M8 10.5h5M10.5 8v5" strokeLinecap="round" />
        </svg>
      </button>
      {allowAdd && (
        <button type="button" aria-label="Ajouter un produit" title="Ajouter un produit" onClick={() => choose("add")} disabled={saving} className="flex h-10 w-8 items-center justify-center text-neutral-500 transition hover:text-[var(--brand-accent)] disabled:opacity-50">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="h-5 w-5" aria-hidden="true">
            <path d="M4 7h3l1.5-2h7L17 7h3v12H4V7Z" strokeLinejoin="round" />
            <path d="M12 9v6M9 12h6" strokeLinecap="round" />
          </svg>
        </button>
      )}
      {pickerAction && (
        <div role="group" aria-label={pickerAction === "search" ? "Choisir une photo pour la recherche" : "Choisir une photo pour le produit"} className="absolute right-0 top-11 z-[60] w-52 overflow-hidden rounded-xl border border-neutral-200 bg-white p-1 text-xs text-neutral-900 shadow-xl">
          <button type="button" onClick={() => openPicker("camera")} className="block w-full rounded-lg px-3 py-3 text-left hover:bg-neutral-100">Prendre une photo</button>
          <button type="button" onClick={() => openPicker("gallery")} className="block w-full rounded-lg px-3 py-3 text-left hover:bg-neutral-100">Choisir dans la galerie</button>
        </div>
      )}
      <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="sr-only" onChange={handleInputChange} />
      <input ref={galleryInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={handleInputChange} />
      {saving && <p role="status" className="absolute right-0 top-11 z-[60] w-56 text-xs text-neutral-500">Préparation de la photo…</p>}
      {notice && <p role="status" className="absolute right-0 top-11 z-[60] w-56 text-xs text-red-700">{notice}</p>}
    </div>
  );
}
