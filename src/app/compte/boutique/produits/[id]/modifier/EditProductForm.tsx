"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import {
  PRODUCT_IMAGE_BUCKET,
  PRODUCT_IMAGE_MAX_BYTES,
  buildProductImagePath,
  compressProductImage,
  hasValidProductImageSignature,
  safeProductImageUrl,
} from "@/lib/product-image";
import type { Product } from "@/types/product";
import type { Category } from "@/server/catalog/categories";

const MAX_PRODUCT_IMAGES = 5;

type ExistingImage = { id: string; image_url: string; sort_order: number };

export default function EditProductForm({
  product,
  shopId,
  initialImages,
  categories,
}: {
  product: Product;
  shopId: string;
  initialImages: ExistingImage[];
  categories: Category[];
}) {
  const router = useRouter();
  const [keptImages, setKeptImages] = useState(initialImages);
  const [files, setFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const previewUrlsRef = useRef<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => previewUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
  }, []);

  async function addFiles(selected: File[]) {
    if (selected.length === 0) return;
    const remaining = MAX_PRODUCT_IMAGES - keptImages.length - files.length;
    if (remaining <= 0 || selected.length > remaining) {
      setError("Tu peux conserver ou ajouter jusqu'à 5 photos au total.");
      return;
    }

    const accepted: File[] = [];
    for (const file of selected) {
      if (file.size > PRODUCT_IMAGE_MAX_BYTES) {
        setError("Une image dépasse la taille maximale autorisée (25 Mo).");
        return;
      }
      if (!(await hasValidProductImageSignature(file))) {
        setError("Format invalide. Utilise une image JPEG, PNG ou WebP.");
        return;
      }
      accepted.push(file);
    }

    const urls = accepted.map((file) => URL.createObjectURL(file));
    previewUrlsRef.current = [...previewUrlsRef.current, ...urls];
    setFiles((current) => [...current, ...accepted]);
    setPreviewUrls((current) => [...current, ...urls]);
    setError(null);
  }

  function removeNewImage(index: number) {
    const url = previewUrls[index];
    if (url) URL.revokeObjectURL(url);
    previewUrlsRef.current = previewUrlsRef.current.filter((item) => item !== url);
    setFiles((current) => current.filter((_, i) => i !== index));
    setPreviewUrls((current) => current.filter((_, i) => i !== index));
  }

  function applyEditedPhoto(index: number, edited: File) {
    const oldUrl = previewUrls[index];
    if (oldUrl) URL.revokeObjectURL(oldUrl);
    const nextUrl = URL.createObjectURL(edited);
    previewUrlsRef.current = previewUrlsRef.current.map((url, i) => i === index ? nextUrl : url);
    setFiles((current) => current.map((file, i) => i === index ? edited : file));
    setPreviewUrls((current) => current.map((url, i) => i === index ? nextUrl : url));
    setEditingIndex(null);
    setError(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    const formData = new FormData(event.currentTarget);
    const name = String(formData.get("name") ?? "").trim();
    const description = String(formData.get("description") ?? "").trim();
    const categoryId = String(formData.get("categoryId") ?? "");
    const price = Number(String(formData.get("price") ?? "").trim());
    const productType = String(formData.get("productType") ?? "other");
    const stockQuantity = Number(formData.get("stockQuantity") ?? 0);
    const perfumeRaw = String(formData.get("perfumeVolumeMl") ?? "").trim();
    const perfumeVolumeMl = perfumeRaw ? Number(perfumeRaw) : null;
    const sizeLines = String(formData.get("sizeStock") ?? "")
      .split("\n").map((line) => line.trim()).filter(Boolean);
    const sizeStock: Record<string, number> = {};
    for (const line of sizeLines) {
      const match = line.match(/^([^:]{1,20}):\s*(\d+)$/);
      if (match) sizeStock[match[1].trim().toUpperCase()] = Number(match[2]);
    }

    if (
      name.length < 2 || name.length > 120 ||
      !Number.isFinite(price) || price <= 0 ||
      !categoryId ||
      !["clothing", "perfume", "other"].includes(productType) ||
      keptImages.length + files.length < 1 ||
      keptImages.length + files.length > MAX_PRODUCT_IMAGES ||
      (productType === "clothing" && (
        sizeLines.length === 0 ||
        Object.keys(sizeStock).length !== sizeLines.length ||
        Object.values(sizeStock).some((qty) => !Number.isInteger(qty) || qty < 0)
      )) ||
      (productType !== "clothing" && (!Number.isInteger(stockQuantity) || stockQuantity < 0)) ||
      (productType === "perfume" && perfumeVolumeMl !== null &&
        (!Number.isInteger(perfumeVolumeMl) || perfumeVolumeMl < 1 || perfumeVolumeMl > 5000))
    ) {
      setError("Vérifie le titre, la catégorie, le prix, le stock et les photos.");
      return;
    }

    setSaving(true);
    setError(null);
    const supabase = createSupabaseBrowserClient();
    const uploadedPaths: string[] = [];

    try {
      for (let index = 0; index < files.length; index += 1) {
        const compressed = await compressProductImage(files[index]);
        const path = buildProductImagePath(shopId);
        const { error: uploadError } = await supabase.storage
          .from(PRODUCT_IMAGE_BUCKET)
          .upload(path, compressed, { contentType: "image/jpeg", upsert: false });
        if (uploadError) throw uploadError;
        uploadedPaths.push(path);
      }

      const { error: updateError } = await supabase
        .from("products")
        .update({
          name,
          description: description || null,
          base_price: Math.round(price),
          category_id: categoryId,
          product_type: productType,
          size_stock: productType === "clothing" ? sizeStock : {},
          perfume_volume_ml: productType === "perfume" ? perfumeVolumeMl : null,
          stock_quantity: productType === "clothing"
            ? Object.values(sizeStock).reduce((sum, qty) => sum + qty, 0)
            : stockQuantity,
        })
        .eq("id", product.id)
        .eq("shop_id", shopId);

      if (updateError) throw updateError;

      const newRows = uploadedPaths.map((path, index) => {
        const { data } = supabase.storage.from(PRODUCT_IMAGE_BUCKET).getPublicUrl(path);
        return {
          product_id: product.id,
          image_url: data.publicUrl,
          sort_order: keptImages.length + index,
        };
      });

      if (newRows.length > 0) {
        const { error: insertImagesError } = await supabase.from("product_images").insert(newRows);
        if (insertImagesError) {
          await supabase.storage.from(PRODUCT_IMAGE_BUCKET).remove(uploadedPaths);
          setError("Les informations ont été enregistrées, mais l'ajout des nouvelles photos a échoué. Les anciennes photos sont conservées.");
          setSaving(false);
          return;
        }
      }

      const removedImages = initialImages.filter(
        (image) => !keptImages.some((kept) => kept.id === image.id)
      );
      if (removedImages.length > 0) {
        const { error: deleteRowsError } = await supabase
          .from("product_images")
          .delete()
          .in("id", removedImages.map((image) => image.id))
          .eq("product_id", product.id);

        if (deleteRowsError) {
          setError("Les informations sont enregistrées, mais certaines anciennes photos n'ont pas pu être retirées.");
          setSaving(false);
          router.refresh();
          return;
        }

        const prefix = "/storage/v1/object/public/" + PRODUCT_IMAGE_BUCKET + "/";
        const paths = removedImages.flatMap((image) => {
          const marker = image.image_url.indexOf(prefix);
          if (marker < 0) return [];
          try {
            const path = decodeURIComponent(image.image_url.slice(marker + prefix.length));
            return path.startsWith(shopId + "/") && !path.includes("..") ? [path] : [];
          } catch {
            return [];
          }
        });
        if (paths.length > 0) {
          const { error: removeStorageError } = await supabase.storage.from(PRODUCT_IMAGE_BUCKET).remove(paths);
          if (removeStorageError) {
            setError("Annonce mise à jour, mais certaines anciennes photos restent dans le stockage.");
            setSaving(false);
            router.refresh();
            return;
          }
        }
      }

      router.push("/compte/boutique/produits");
      router.refresh();
    } catch {
      if (uploadedPaths.length > 0) {
        await supabase.storage.from(PRODUCT_IMAGE_BUCKET).remove(uploadedPaths);
      }
      setError("La modification a échoué. Vérifie ta connexion et réessaie.");
      setSaving(false);
    }
  }

  const currentCount = keptImages.length + files.length;
  const sizeStockText = Object.entries(product.size_stock ?? {})
    .map(([size, quantity]) => size + ": " + quantity).join("\n");

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <section className="grid gap-3 rounded-2xl border border-[var(--brand-border)] bg-[var(--brand-bg)] p-4">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-semibold">Photos de l'annonce</p>
          <span className="text-xs text-[var(--brand-muted)]">{currentCount}/5</span>
        </div>
        {keptImages.length > 0 && (
          <div className="grid grid-cols-3 gap-2">
            {keptImages.map((image, index) => {
              const imageUrl = safeProductImageUrl(image.image_url);
              return (
                <div key={image.id} className="relative aspect-square overflow-hidden rounded-xl border border-[var(--brand-border)] bg-[var(--brand-surface)]">
                  {imageUrl && <Image src={imageUrl} alt={"Photo existante " + (index + 1)} fill sizes="(max-width: 640px) 30vw, 160px" className="object-contain" />}
                  <button type="button" onClick={() => setKeptImages((current) => current.filter((item) => item.id !== image.id))} aria-label={"Retirer la photo " + (index + 1)} className="absolute right-1 top-1 grid h-7 w-7 place-items-center rounded-full bg-black/75 text-white">×</button>
                  {index === 0 && <span className="absolute bottom-1 left-1 rounded bg-black/70 px-2 py-1 text-[10px] text-white">Existante</span>}
                </div>
              );
            })}
          </div>
        )}
        {previewUrls.length > 0 && (
          <div className="grid grid-cols-3 gap-2">
            {previewUrls.map((url, index) => (
              <div key={url} className="relative aspect-square overflow-hidden rounded-xl border border-[var(--brand-border)] bg-[var(--brand-surface)]">
                {/* eslint-disable-next-line @next/next/no-img-element -- aperçu local (blob URL) */}
                <img src={url} alt={"Nouvelle photo " + (index + 1)} className="h-full w-full object-contain" />
                <button type="button" onClick={() => removeNewImage(index)} aria-label={"Retirer la nouvelle photo " + (index + 1)} className="absolute right-1 top-1 grid h-7 w-7 place-items-center rounded-full bg-black/75 text-white">×</button>
                <button type="button" onClick={() => setEditingIndex(index)} className="absolute bottom-1 right-1 rounded-full bg-white/95 px-2 py-1 text-[10px] font-semibold text-black">Améliorer</button>
              </div>
            ))}
          </div>
        )}
        {editingIndex !== null && files[editingIndex] && (
          <ProductPhotoStudio file={files[editingIndex]} onApply={(edited) => applyEditedPhoto(editingIndex, edited)} onCancel={() => setEditingIndex(null)} />
        )}
        <div className="flex flex-wrap gap-2">
          <button type="button" disabled={saving || currentCount >= MAX_PRODUCT_IMAGES} onClick={() => cameraInputRef.current?.click()} className="rounded-xl border border-[var(--brand-border)] px-4 py-3 text-sm font-semibold disabled:opacity-50">Prendre une photo</button>
          <button type="button" disabled={saving || currentCount >= MAX_PRODUCT_IMAGES} onClick={() => galleryInputRef.current?.click()} className="rounded-xl border border-[var(--brand-border)] px-4 py-3 text-sm font-semibold disabled:opacity-50">Choisir dans la galerie</button>
        </div>
        <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="sr-only" onChange={(event) => { const file = event.currentTarget.files?.[0]; event.currentTarget.value = ""; if (file) void addFiles([file]); }} />
        <input ref={galleryInputRef} type="file" accept="image/jpeg,image/png,image/webp" multiple className="sr-only" onChange={(event) => { const selected = Array.from(event.currentTarget.files ?? []); event.currentTarget.value = ""; void addFiles(selected); }} />
        <p className="text-xs text-[var(--brand-muted)]">Tu peux garder, retirer ou ajouter des photos. Maximum 5 photos au total.</p>
      </section>

      <label className="grid gap-1 text-sm font-medium">Nom du produit
        <input name="name" required minLength={2} maxLength={120} defaultValue={product.name} className="w-full rounded-xl border border-[var(--brand-border)] bg-[var(--brand-surface)] px-4 py-3 text-sm text-[var(--brand-text)]" />
      </label>
      <label className="grid gap-1 text-sm font-medium">Catégorie
        <select name="categoryId" required defaultValue={product.category_id ?? ""} className="w-full rounded-xl border border-[var(--brand-border)] bg-[var(--brand-surface)] px-4 py-3 text-sm text-[var(--brand-text)]">
          <option value="" disabled>Choisir une catégorie</option>
          {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
        </select>
      </label>
      <label className="grid gap-1 text-sm font-medium">Type de produit
        <select name="productType" defaultValue={product.product_type} className="w-full rounded-xl border border-[var(--brand-border)] bg-[var(--brand-surface)] px-4 py-3 text-sm text-[var(--brand-text)]">
          <option value="clothing">Vêtement</option>
          <option value="perfume">Parfum</option>
          <option value="other">Autre produit</option>
        </select>
      </label>
      <label className="grid gap-1 text-sm font-medium">Prix (FCFA)
        <input name="price" type="number" required min={1} step={1} defaultValue={product.base_price} className="w-full rounded-xl border border-[var(--brand-border)] bg-[var(--brand-surface)] px-4 py-3 text-sm text-[var(--brand-text)]" />
      </label>
      <label className="grid gap-1 text-sm font-medium">Stock total (parfum et autres produits)
        <input name="stockQuantity" type="number" min={0} step={1} defaultValue={product.stock_quantity} className="w-full rounded-xl border border-[var(--brand-border)] bg-[var(--brand-surface)] px-4 py-3 text-sm text-[var(--brand-text)]" />
      </label>
      <label className="grid gap-1 text-sm font-medium">Tailles et quantités (vêtements)
        <textarea name="sizeStock" rows={3} defaultValue={sizeStockText} placeholder={"S: 5\nM: 8\nL: 3"} className="w-full rounded-xl border border-[var(--brand-border)] bg-[var(--brand-surface)] px-4 py-3 text-sm text-[var(--brand-text)]" />
      </label>
      <label className="grid gap-1 text-sm font-medium">Volume du parfum (ml, facultatif)
        <input name="perfumeVolumeMl" type="number" min={1} max={5000} step={1} defaultValue={product.perfume_volume_ml ?? ""} className="w-full rounded-xl border border-[var(--brand-border)] bg-[var(--brand-surface)] px-4 py-3 text-sm text-[var(--brand-text)]" />
      </label>
      <label className="grid gap-1 text-sm font-medium">Description
        <textarea name="description" maxLength={2000} rows={4} defaultValue={product.description ?? ""} className="w-full rounded-xl border border-[var(--brand-border)] bg-[var(--brand-surface)] px-4 py-3 text-sm text-[var(--brand-text)]" />
      </label>

      {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
      <div className="flex flex-wrap gap-2">
        <button type="submit" disabled={saving} className="rounded-full bg-[var(--brand-accent)] px-6 py-3 text-sm font-semibold text-white disabled:opacity-50">{saving ? "Enregistrement…" : "Enregistrer les modifications"}</button>
        <button type="button" disabled={saving} onClick={() => router.push("/compte/boutique/produits")} className="rounded-full border border-[var(--brand-border)] px-6 py-3 text-sm font-semibold text-[var(--brand-text)]">Annuler</button>
      </div>
    </form>
  );
}
