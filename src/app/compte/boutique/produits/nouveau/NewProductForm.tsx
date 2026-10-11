"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import {
  PRODUCT_IMAGE_ALLOWED_TYPES,
  PRODUCT_IMAGE_MAX_BYTES,
  PRODUCT_IMAGE_BUCKET,
  buildProductImagePath,
  compressProductImage,
} from "@/lib/product-image";
import type { Category } from "@/server/catalog/categories";

type Status =
  | "idle"
  | "submitting"
  | "error-type"
  | "error-size"
  | "error-network"
  | "error-generic"
  | "error-validation";

const ERROR_MESSAGES: Record<string, string> = {
  "error-type": "Cette image n'est pas valide (JPEG, PNG ou WebP attendus).",
  "error-size": "L'image dépasse la taille maximale autorisée (8 Mo).",
  "error-network": "L'envoi a échoué. Vérifie ta connexion et réessaie.",
  "error-generic": "Une erreur est survenue. Réessaie dans un instant.",
  "error-validation": "Vérifie le titre, le prix et la photo avant de publier.",
};

export default function NewProductForm({
  shopId,
  categories,
}: {
  shopId: string;
  categories: Category[];
}) {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>("idle");

  useEffect(() => {
    if (typeof window === "undefined" || sessionStorage.getItem("revant-photo-action") !== "add") return;
    const dataUrl = sessionStorage.getItem("revant-photo-prefill");
    sessionStorage.removeItem("revant-photo-action");
    sessionStorage.removeItem("revant-photo-prefill");
    if (!dataUrl) return;
    fetch(dataUrl)
      .then((response) => response.blob())
      .then((blob) => {
        const selected = new File([blob], "revant-product-photo.jpg", { type: blob.type || "image/jpeg" });
        if (!PRODUCT_IMAGE_ALLOWED_TYPES.includes(selected.type) || selected.size > PRODUCT_IMAGE_MAX_BYTES) {
          setStatus(selected.size > PRODUCT_IMAGE_MAX_BYTES ? "error-size" : "error-type");
          return;
        }
        setFile(selected);
        setPreviewUrl(URL.createObjectURL(selected));
      })
      .catch(() => setStatus("error-generic"));
  }, []);

  function handleFileSelected(selected: File | undefined) {
    if (!selected) return;

    if (!PRODUCT_IMAGE_ALLOWED_TYPES.includes(selected.type)) {
      setStatus("error-type");
      return;
    }
    if (selected.size > PRODUCT_IMAGE_MAX_BYTES) {
      setStatus("error-size");
      return;
    }

    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(selected);
    setPreviewUrl(URL.createObjectURL(selected));
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
      name.length < 2 || name.length > 120 || !Number.isFinite(price) || price <= 0 || !file ||
      !["clothing", "perfume", "other"].includes(productType) ||
      (productType === "perfume" && perfumeVolumeMl !== null && (!Number.isInteger(perfumeVolumeMl) || perfumeVolumeMl < 1 || perfumeVolumeMl > 5000)) ||
      (productType === "clothing" && (sizeLines.length === 0 || Object.keys(sizeStock).length !== sizeLines.length || Object.values(sizeStock).some((qty) => !Number.isInteger(qty) || qty < 0)))
    ) {
      setStatus("error-validation");
      return;
    }

    setStatus("submitting");

    try {
      const compressed = await compressProductImage(file);
      const supabase = createSupabaseBrowserClient();
      const path = buildProductImagePath(shopId);

      const { error: uploadError } = await supabase.storage
        .from(PRODUCT_IMAGE_BUCKET)
        .upload(path, compressed, { contentType: "image/jpeg", upsert: false });

      if (uploadError) {
        setStatus("error-network");
        return;
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from(PRODUCT_IMAGE_BUCKET).getPublicUrl(path);

      const { data: product, error: insertError } = await supabase
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
          stock_quantity: productType === "clothing" ? Object.values(sizeStock).reduce((sum, qty) => sum + qty, 0) : Math.max(0, Number(formData.get("stockQuantity") ?? 0)),
          slug: `${name.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 60)}-${Date.now().toString(36)}`,
        })
        .select("id")
        .single();

      if (insertError || !product) {
        // Image envoyée mais annonce non enregistrée : on nettoie le
        // fichier orphelin plutôt que de le laisser traîner en stockage.
        await supabase.storage.from(PRODUCT_IMAGE_BUCKET).remove([path]);
        setStatus("error-generic");
        return;
      }

      const { error: imageError } = await supabase.from("product_images").insert({
        product_id: product.id,
        image_url: publicUrl,
        sort_order: 0,
      });

      if (imageError) {
        setStatus("error-generic");
        return;
      }

      router.push("/compte/boutique/produits");
      router.refresh();
    } catch {
      setStatus("error-generic");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <input
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={(e) => handleFileSelected(e.target.files?.[0])}
        className="text-sm"
      />

      {previewUrl && (
        // eslint-disable-next-line @next/next/no-img-element -- aperçu local (blob URL), pas une image distante à optimiser
        <img
          src={previewUrl}
          alt="Aperçu de l'annonce"
          className="rounded-xl w-full aspect-square object-cover"
        />
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
