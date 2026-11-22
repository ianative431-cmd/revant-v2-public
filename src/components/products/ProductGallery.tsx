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
  const selectedIndex = safeImages.length > 0 ? activeIndex % safeImages.length : 0;
  const activeImage = safeImages[selectedIndex] ?? null;

  return (
    <div className="min-w-0">
      <div className="relative aspect-square overflow-hidden rounded-xl bg-[var(--brand-bg)]">
        {activeImage ? (
          <Image
            src={activeImage}
            alt={`${productName} — photo ${selectedIndex + 1}`}
            fill
            priority={selectedIndex === 0}
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
            {selectedIndex + 1} / {safeImages.length}
          </span>
        )}
      </div>
      {safeImages.length > 1 && (
        <div className="mt-3 flex snap-x snap-mandatory gap-2 overflow-x-auto pb-1 [scrollbar-width:thin]" aria-label="Autres photos du produit">
          {safeImages.map((image, index) => (
            <button
              key={`${image}-${index}`}
              type="button"
              onClick={() => setActiveIndex(index)}
              aria-label={`Afficher la photo ${index + 1}`}
              aria-pressed={selectedIndex === index}
              className={`relative aspect-square w-[68px] shrink-0 snap-start overflow-hidden rounded-xl border-2 transition sm:w-[76px] ${
                selectedIndex === index ? "border-[var(--brand-accent)] ring-2 ring-[var(--brand-accent)]/15" : "border-[var(--brand-border)] opacity-75 hover:opacity-100"
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
