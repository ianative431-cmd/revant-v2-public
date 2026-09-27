/**
 * Redimensionne (sans recadrer) une image trop grande et la réencode en
 * JPEG. Logique générique partagée entre les photos d'annonces et les
 * arrière-plans — voir src/lib/product-image.ts et
 * src/lib/background-image.ts pour les constantes propres à chacun.
 */
export function compressImageKeepingAspect(
  file: File,
  maxDimension: number,
  quality: number
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      const scale = Math.min(1, maxDimension / Math.max(img.width, img.height));
      const width = Math.max(1, Math.round(img.width * scale));
      const height = Math.max(1, Math.round(img.height * scale));

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("canvas_unavailable"));
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error("compression_failed"))),
        "image/jpeg",
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("image_load_failed"));
    };

    img.src = objectUrl;
  });
}
