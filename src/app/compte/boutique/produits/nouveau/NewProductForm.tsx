"use client";

import { useState, type FormEvent } from "react";
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

const CLOTHING_SIZES = ["XS", "S", "M", "L", "XL", "XXL", "36", "38", "40", "42", "44", "46"];

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
  const [categoryId, setCategoryId] = useState("");
  const [sizeStock, setSizeStock] = useState<Record<string, string>>({});
  const slug = categories.find((c) => c.id === categoryId)?.slug.toLowerCase() ?? "";
  const isClothing = /vetement|vêtement|clothing|habit/.test(slug);
  const isPerfume = /parfum|perfume|fragrance/.test(slug);

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
    const categoryIdFromForm = String(formData.get("categoryId") ?? "");
    const brand = String(formData.get("brand") ?? "").trim();
    const volumeRaw = String(formData.get("volumeMl") ?? "").trim();
    const volumeMl = volumeRaw ? Number(volumeRaw) : null;
    const manualStock = Number(formData.get("stockQuantity") ?? 0);
    const sizes: Record<string, number> = {};
    if (isClothing) for (const [size, raw] of Object.entries(sizeStock)) { const n = Number(raw || 0); if (Number.isInteger(n) && n > 0) sizes[size] = n; }
    const stockQuantity = isClothing ? Object.values(sizes).reduce((a, b) => a + b, 0) : manualStock;
    const price = Number(priceRaw);

    if (name.length < 2 || name.length > 120 || !Number.isFinite(price) || price <= 0 || !file || !categoryIdFromForm || !Number.isInteger(stockQuantity) || stockQuantity < 0 || (isClothing && stockQuantity < 1) || (isPerfume && volumeMl !== null && (!Number.isInteger(volumeMl) || volumeMl < 1 || volumeMl > 10000))) {
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
          category_id: categoryIdFromForm.length > 0 ? categoryIdFromForm : null,
          stock_quantity: stockQuantity,
          size_stock: isClothing ? sizes : {},
          brand: brand || null,
          volume_ml: isPerfume && volumeMl ? volumeMl : null,
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
        value={categoryId}
        onChange={(e) => { setCategoryId(e.target.value); setSizeStock({}); }}
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

      <input
        name="price"
        type="number"
        required
        min={1}
        step={1}
        placeholder="Prix (FCFA)"
        className="border rounded-xl px-4 py-3 text-sm"
      />

            {isClothing ? <fieldset className="rounded-xl border p-3"><legend className="px-1 text-sm font-semibold">Stock par taille</legend><p className="mb-3 text-xs text-neutral-500">Le stock total est calculé à partir des tailles disponibles.</p><div className="grid grid-cols-3 gap-2">{CLOTHING_SIZES.map((size) => <label key={size} className="text-xs font-semibold">{size}<input type="number" min={0} max={100000} step={1} inputMode="numeric" value={sizeStock[size] ?? ""} onChange={(e) => setSizeStock((old) => ({ ...old, [size]: e.target.value }))} placeholder="0" className="mt-1 w-full rounded-lg border px-2 py-2 text-sm" /></label>)}</div></fieldset> : <input name="stockQuantity" type="number" required min={0} max={100000} step={1} defaultValue={1} inputMode="numeric" placeholder="Quantité disponible" className="w-full rounded-xl border px-4 py-3 text-sm" />}
      {(!isClothing || isPerfume) && <input name="brand" maxLength={100} placeholder="Marque (facultatif)" className="w-full rounded-xl border px-4 py-3 text-sm" />}
      {isPerfume && <input name="volumeMl" type="number" min={1} max={10000} step={1} inputMode="numeric" placeholder="Volume du parfum en ml (facultatif)" className="w-full rounded-xl border px-4 py-3 text-sm" />}

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
