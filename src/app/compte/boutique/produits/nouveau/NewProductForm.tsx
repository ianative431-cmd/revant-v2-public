"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import {
  PRODUCT_IMAGE_ALLOWED_TYPES,
  PRODUCT_IMAGE_MAX_BYTES,
  PRODUCT_IMAGE_BUCKET,
  buildProductImagePath,
  compressProductImage,
  hasValidProductImageSignature,
} from "@/lib/product-image";
import type { Category } from "@/server/catalog/categories";
import { consumePendingProductImage } from "@/lib/pending-product-image";

const MAX_PRODUCT_IMAGES = 5;

type Status =
  | "idle"
  | "submitting"
  | "error-type"
  | "error-size"
  | "error-network"
  | "error-generic"
  | "error-validation"
  | "error-count";

const ERROR_MESSAGES: Record<string, string> = {
  "error-type": "Cette image n'est pas valide (JPEG, PNG ou WebP attendus).",
  "error-size": "Une image dépasse la taille maximale autorisée (8 Mo).",
  "error-network": "L'envoi a échoué. Vérifie ta connexion et réessaie.",
  "error-generic": "Une erreur est survenue. Réessaie dans un instant.",
  "error-validation": "Vérifie le titre, le prix et ajoute au moins une photo.",
  "error-count": "Tu peux ajouter jusqu'à 5 photos par produit.",
};

export default function NewProductForm({
  shopId,
  shopStatus,
  categories,
}: {
  shopId: string;
  shopStatus: "draft" | "pending" | "active" | "suspended" | "closed";
  categories: Category[];
}) {
  const router = useRouter();
  const [files, setFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const previewUrlsRef = useRef<string[]>([]);
  const [status, setStatus] = useState<Status>("idle");

  useEffect(() => {
    if (typeof window === "undefined") return;
    let action: string | null = null;
    let legacyDataUrl: string | null = null;
    try {
      action = sessionStorage.getItem("revant-photo-action");
      if (action !== "add") return;
      legacyDataUrl = sessionStorage.getItem("revant-photo-prefill");
      sessionStorage.removeItem("revant-photo-action");
      sessionStorage.removeItem("revant-photo-prefill");
    } catch {
      queueMicrotask(() => setStatus("error-generic"));
      return;
    }

    let active = true;
    async function restorePhoto() {
      try {
        let selected: File | null = null;
        try {
          selected = await consumePendingProductImage();
        } catch {
          if (!legacyDataUrl) throw new Error("Photo temporaire indisponible.");
        }
        if (!selected && legacyDataUrl) {
          const response = await fetch(legacyDataUrl);
          const blob = await response.blob();
          selected = new File([blob], "revant-product-photo.jpg", { type: blob.type || "image/jpeg" });
        }
        if (!active || !selected) return;
        if (selected.size > PRODUCT_IMAGE_MAX_BYTES) {
          setStatus("error-size");
          return;
        }
        if (!(await hasValidProductImageSignature(selected))) {
          setStatus("error-type");
          return;
        }
        const previewUrl = URL.createObjectURL(selected);
        previewUrlsRef.current = [previewUrl];
        setFiles([selected]);
        setPreviewUrls([previewUrl]);
      } catch {
        if (active) setStatus("error-generic");
      }
    }
    void restorePhoto();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    return () => previewUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
  }, []);

  async function handleFilesSelected(selectedFiles: File[]) {
    if (selectedFiles.length === 0) return;
    const remaining = MAX_PRODUCT_IMAGES - files.length;
    if (remaining <= 0 || selectedFiles.length > remaining) {
      setStatus("error-count");
      return;
    }

    const accepted: File[] = [];
    for (const selected of selectedFiles.slice(0, Math.max(0, remaining))) {
      if (selected.size > PRODUCT_IMAGE_MAX_BYTES) {
        setStatus("error-size");
        return;
      }
      if (!(await hasValidProductImageSignature(selected))) {
        setStatus("error-type");
        return;
      }
      accepted.push(selected);
    }

    if (accepted.length > 0) {
      const newPreviewUrls = accepted.map((selected) => URL.createObjectURL(selected));
      previewUrlsRef.current = [...previewUrlsRef.current, ...newPreviewUrls];
      setFiles((current) => [...current, ...accepted].slice(0, MAX_PRODUCT_IMAGES));
      setPreviewUrls((current) => [...current, ...newPreviewUrls].slice(0, MAX_PRODUCT_IMAGES));
      setStatus("idle");
    }
  }

  function removeImage(index: number) {
    const removedUrl = previewUrls[index];
    if (removedUrl) URL.revokeObjectURL(removedUrl);
    previewUrlsRef.current = previewUrlsRef.current.filter((url) => url !== removedUrl);
    setFiles((current) => current.filter((_, i) => i !== index));
    setPreviewUrls((current) => current.filter((_, i) => i !== index));
    setStatus("idle");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const name = String(formData.get("name") ?? "").trim();
    const description = String(formData.get("description") ?? "").trim();
    const priceRaw = String(formData.get("price") ?? "").trim();
    const categoryId = String(formData.get("categoryId") ?? "");
    const productType = String(formData.get("productType") ?? "other");
    const perfumeVolumeRaw = String(formData.get("perfumeVolumeMl") ?? "").trim();
    const perfumeVolumeMl = perfumeVolumeRaw ? Number(perfumeVolumeRaw) : null;
    const sizeLines = String(formData.get("sizeStock") ?? "").split("\n").map((line) => line.trim()).filter(Boolean);
    const sizeStock: Record<string, number> = {};
    for (const line of sizeLines) {
      const match = line.match(/^([^:]{1,20}):\s*(\d+)$/);
      if (match) sizeStock[match[1].trim().toUpperCase()] = Number(match[2]);
    }
    const price = Number(priceRaw);

    if (
      name.length < 2 || name.length > 120 || !Number.isFinite(price) || price <= 0 || files.length === 0 ||
      files.length > MAX_PRODUCT_IMAGES ||
      !["clothing", "perfume", "other"].includes(productType) ||
      (productType === "perfume" && perfumeVolumeMl !== null && (!Number.isInteger(perfumeVolumeMl) || perfumeVolumeMl < 1 || perfumeVolumeMl > 5000)) ||
      (productType === "clothing" && (sizeLines.length === 0 || Object.keys(sizeStock).length !== sizeLines.length || Object.values(sizeStock).some((qty) => !Number.isInteger(qty) || qty < 0)))
    ) {
      setStatus("error-validation");
      return;
    }

    setStatus("submitting");
    let supabase: ReturnType<typeof createSupabaseBrowserClient> | null = null;
    const uploadedPaths: string[] = [];
    let createdProductId: string | null = null;

    try {
      const client = createSupabaseBrowserClient();
      supabase = client;
      for (let index = 0; index < files.length; index += 1) {
        const compressed = await compressProductImage(files[index]);
        const basePath = buildProductImagePath(shopId);
        const path = basePath.replace(/\.jpg$/, "-" + index + ".jpg");
        const { error: uploadError } = await client.storage
          .from(PRODUCT_IMAGE_BUCKET)
          .upload(path, compressed, { contentType: "image/jpeg", upsert: false });

        if (uploadError) {
          if (uploadedPaths.length > 0) await client.storage.from(PRODUCT_IMAGE_BUCKET).remove(uploadedPaths);
          setStatus("error-network");
          return;
        }
        uploadedPaths.push(path);
      }

      const { data: product, error: insertError } = await client
        .from("products")
        .insert({
          shop_id: shopId,
          name,
          description: description.length > 0 ? description : null,
          base_price: Math.round(price),
          category_id: categoryId.length > 0 ? categoryId : null,
          product_type: productType,
          size_stock: productType === "clothing" ? sizeStock : {},
          perfume_volume_ml: productType === "perfume" ? perfumeVolumeMl : null,
          status: shopStatus === "active" ? "active" : "pending",
          stock_quantity: productType === "clothing" ? Object.values(sizeStock).reduce((sum, qty) => sum + qty, 0) : Math.max(0, Number(formData.get("stockQuantity") ?? 0)),
          slug: name.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 60) + "-" + Date.now().toString(36),
        })
        .select("id")
        .single();

      if (insertError || !product) {
        await client.storage.from(PRODUCT_IMAGE_BUCKET).remove(uploadedPaths);
        setStatus("error-generic");
        return;
      }

      createdProductId = product.id;

      const imageRows = uploadedPaths.map((path, index) => {
        const { data } = client.storage.from(PRODUCT_IMAGE_BUCKET).getPublicUrl(path);
        return {
          product_id: product.id,
          image_url: data.publicUrl,
          sort_order: index,
        };
      });

      const { error: imageError } = await client.from("product_images").insert(imageRows);

      if (imageError) {
        await client.from("products").delete().eq("id", product.id);
        await client.storage.from(PRODUCT_IMAGE_BUCKET).remove(uploadedPaths);
        setStatus("error-generic");
        return;
      }

      router.push("/compte/boutique/produits");
      router.refresh();
    } catch {
      if (supabase && createdProductId) {
        await supabase.from("products").delete().eq("id", createdProductId);
      }
      if (supabase && uploadedPaths.length > 0) {
        await supabase.storage.from(PRODUCT_IMAGE_BUCKET).remove(uploadedPaths);
      }
      setStatus("error-generic");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <label className="grid gap-2 text-sm font-medium">
        Photos du produit (jusqu&apos;à 5)
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          onChange={(event) => {
            void handleFilesSelected(Array.from(event.currentTarget.files ?? []));
            event.currentTarget.value = "";
          }}
          className="text-sm"
        />
        <span className="text-xs font-normal text-neutral-500">
          Tu peux prendre une photo avec ton téléphone ou choisir plusieurs images dans la galerie.
        </span>
      </label>

      {previewUrls.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {previewUrls.map((url, index) => (
            <div key={url} className="relative aspect-square overflow-hidden rounded-xl bg-neutral-100">
              {/* eslint-disable-next-line @next/next/no-img-element -- aperçu local (blob URL) */}
              <img src={url} alt={"Aperçu photo " + (index + 1)} className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => removeImage(index)}
                aria-label={"Retirer la photo " + (index + 1)}
                className="absolute right-1 top-1 grid h-7 w-7 place-items-center rounded-full bg-black/70 text-sm text-white"
              >
                ×
              </button>
              {index === 0 && (
                <span className="absolute bottom-1 left-1 rounded bg-black/70 px-2 py-1 text-[10px] text-white">
                  Principale
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      <input
        name="name"
        type="text"
        required
        minLength={2}
        maxLength={120}
        placeholder="Titre de l'annonce"
        className="border rounded-xl px-4 py-3 text-sm"
      />

      <select
        name="categoryId"
        required
        defaultValue=""
        className="border rounded-xl px-4 py-3 text-sm bg-white"
      >
        <option value="" disabled>
          Catégorie
        </option>
        {categories.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>

      <label className="grid gap-1 text-sm font-medium">Type de produit
        <select name="productType" defaultValue="other" className="border rounded-xl px-4 py-3 text-sm bg-white">
          <option value="clothing">Vêtement (tailles et stock par taille)</option>
          <option value="perfume">Parfum (volume en ml)</option>
          <option value="other">Autre produit</option>
        </select>
      </label>
      <label className="grid gap-1 text-sm font-medium">Stock total (parfum et autres produits)
        <input name="stockQuantity" type="number" min={0} step={1} defaultValue={1} className="border rounded-xl px-4 py-3 text-sm" />
      </label>
      <label className="grid gap-1 text-sm font-medium">Tailles et quantités (vêtements)
        <textarea name="sizeStock" rows={3} placeholder={"S: 5\nM: 8\nL: 3"} className="border rounded-xl px-4 py-3 text-sm resize-y" />
        <span className="text-xs font-normal text-neutral-500">Une taille par ligne, au format Taille : quantité. Les quantités peuvent être 0.</span>
      </label>
      <label className="grid gap-1 text-sm font-medium">Volume du parfum (ml, facultatif)
        <input name="perfumeVolumeMl" type="number" min={1} max={5000} step={1} placeholder="Ex. 100" className="border rounded-xl px-4 py-3 text-sm" />
      </label>

      <input
        name="price"
        type="number"
        required
        min={1}
        step={1}
        placeholder="Prix (FCFA)"
        className="border rounded-xl px-4 py-3 text-sm"
      />

      <textarea
        name="description"
        maxLength={2000}
        rows={4}
        placeholder="Description (facultatif)"
        className="border rounded-xl px-4 py-3 text-sm resize-none"
      />

      {status !== "idle" && status !== "submitting" && (
        <p className="text-red-600 text-sm">{ERROR_MESSAGES[status]}</p>
      )}

      <button
        type="submit"
        disabled={status === "submitting"}
        className="bg-black text-white rounded-full py-3 text-sm font-medium disabled:opacity-50"
      >
        {status === "submitting" ? "Publication..." : "Publier l'annonce"}
      </button>
    </form>
  );
}
