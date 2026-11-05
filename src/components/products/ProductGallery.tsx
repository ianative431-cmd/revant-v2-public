"use client";

import Image from "next/image";
import { useState } from "react";
import { safeProductImageUrl } from "@/lib/product-image";

export default function ProductGallery({
  images,
  productName,
  outOfStock,
}: {
  images: string[];
  productName: string;
  outOfStock: boolean;
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const safeImages = images
    .map((image) => safeProductImageUrl(image))
    .filter((image): image is string => image !== null);
  const activeImage = safeImages[activeIndex] ?? safeImages[0] ?? null;

  return (
    <div className="min-w-0">
      <div className="relative aspect-square overflow-hidden rounded-xl bg-[var(--brand-bg)]">
        {activeImage ? (
          <Image
            src={activeImage}
            alt={`${productName} — photo ${activeIndex + 1}`}
            fill
            priority={activeIndex === 0}
            sizes="(max-width: 640px) 100vw, 50vw"
            className="object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-sm text-[var(--brand-muted)]">
            Photo indisponible
          </div>
        )}
        {outOfStock && (
          <span className="absolute left-3 top-3 rounded-full bg-black px-3 py-1 text-xs text-white">
            Épuisé
          </span>
        )}
        {safeImages.length > 1 && (
          <span className="absolute bottom-3 right-3 rounded-full bg-black/70 px-3 py-1 text-xs font-semibold text-white">
            {activeIndex + 1} / {safeImages.length}
          </span>
        )}
      </div>
      {safeImages.length > 1 && (
        <div className="mt-3 grid grid-cols-5 gap-2" aria-label="Autres photos du produit">
          {safeImages.map((image, index) => (
            <button
              key={`${image}-${index}`}
              type="button"
              onClick={() => setActiveIndex(index)}
              aria-label={`Afficher la photo ${index + 1}`}
              aria-pressed={activeIndex === index}
              className={`relative aspect-square overflow-hidden rounded-lg border-2 ${
                activeIndex === index ? "border-[var(--brand-accent)]" : "border-transparent"
              }`}
            >
              <Image src={image} alt="" fill sizes="20vw" className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
