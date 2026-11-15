"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Props = {
  file: File;
  onApply: (file: File) => void;
  onCancel: () => void;
};

function renderAdjustedImage(
  image: HTMLImageElement,
  canvas: HTMLCanvasElement,
  brightness: number,
  contrast: number,
  sharpness: number,
  maxDimension?: number,
) {
  const scale = maxDimension
    ? Math.min(1, maxDimension / Math.max(image.naturalWidth, image.naturalHeight))
    : 1;
  canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
  canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.filter = `brightness(${brightness}%) contrast(${contrast}%)`;
  ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
  ctx.filter = "none";

  if (sharpness > 0) {
    const source = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const output = ctx.createImageData(source);
    const amount = sharpness / 100;
    const data = source.data;
    const target = output.data;
    target.set(data);
    for (let y = 1; y < canvas.height - 1; y++) {
      for (let x = 1; x < canvas.width - 1; x++) {
        const i = (y * canvas.width + x) * 4;
        for (let channel = 0; channel < 3; channel++) {
          const neighbors =
            data[i - 4 + channel] +
            data[i + 4 + channel] +
            data[i - canvas.width * 4 + channel] +
            data[i + canvas.width * 4 + channel];
          target[i + channel] = Math.max(
            0,
            Math.min(255, data[i + channel] + amount * (4 * data[i + channel] - neighbors) * 0.25),
          );
        }
      }
    }
    ctx.putImageData(output, 0, 0);
  }
}

export default function ProductPhotoStudio({ file, onApply, onCancel }: Props) {
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [sharpness, setSharpness] = useState(0);
  const [busy, setBusy] = useState(false);
  const [imageReady, setImageReady] = useState(false);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const drawPreview = useCallback(() => {
    const image = imageRef.current;
    const canvas = canvasRef.current;
    if (!image || !canvas) return;
    renderAdjustedImage(image, canvas, brightness, contrast, sharpness, 1000);
  }, [brightness, contrast, sharpness]);

  useEffect(() => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      imageRef.current = image;
      setImageReady(true);
    };
    image.onerror = () => setImageReady(false);
    image.src = url;
    return () => {
      URL.revokeObjectURL(url);
      imageRef.current = null;
      setImageReady(false);
    };
  }, [file]);

  useEffect(() => {
    if (imageReady) drawPreview();
  }, [drawPreview, imageReady]);

  function autoCorrect() {
    const image = imageRef.current;
    if (!image) return;
    const sample = document.createElement("canvas");
    const scale = Math.min(1, 160 / Math.max(image.naturalWidth, image.naturalHeight));
    sample.width = Math.max(1, Math.round(image.naturalWidth * scale));
    sample.height = Math.max(1, Math.round(image.naturalHeight * scale));
    const context = sample.getContext("2d", { willReadFrequently: true });
    if (!context) return;
    context.drawImage(image, 0, 0, sample.width, sample.height);
    const pixels = context.getImageData(0, 0, sample.width, sample.height).data;
    let luminance = 0;
    let count = 0;
    for (let i = 0; i < pixels.length; i += 16) {
      luminance += 0.2126 * pixels[i] + 0.7152 * pixels[i + 1] + 0.0722 * pixels[i + 2];
      count += 1;
    }
    const average = count ? luminance / count : 128;
    setBrightness(Math.max(85, Math.min(115, Math.round((128 / Math.max(1, average)) * 100))));
    setContrast(average > 210 || average < 45 ? 105 : 108);
    setSharpness(8);
  }

  async function apply() {
    const image = imageRef.current;
    if (!image) return;
    setBusy(true);
    try {
      // Export at the original pixel dimensions; the preview alone is downscaled.
      const exportCanvas = document.createElement("canvas");
      renderAdjustedImage(image, exportCanvas, brightness, contrast, sharpness);
      const blob = await new Promise<Blob>((resolve, reject) => {
        exportCanvas.toBlob(
          (value) => (value ? resolve(value) : reject(new Error("Export impossible"))),
          "image/jpeg",
          0.94,
        );
      });
      onApply(
        new File([blob], file.name.replace(/\.[^.]+$/, "") + "-revant.jpg", {
          type: "image/jpeg",
          lastModified: Date.now(),
        }),
      );
    } catch {
      setBusy(false);
    }
  }

  return (
    <section className="rounded-2xl border border-neutral-200 bg-white p-4 text-neutral-900" aria-label="Studio photo Revant">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div>
          <p className="text-base font-semibold">Studio photo Revant</p>
          <p className="text-xs text-neutral-500">Retouche locale · original conservé</p>
        </div>
        <span className="rounded-full bg-emerald-50 px-2 py-1 text-xs text-emerald-800">Sans IA générative</span>
      </div>
      <div className="overflow-hidden rounded-xl bg-neutral-100">
        <canvas ref={canvasRef} className="block max-h-[360px] w-full object-contain" aria-label="Aperçu de la photo retouchée" />
      </div>
      <p className="mt-2 text-xs text-neutral-500">
        La correction automatique ajuste la photo sans modifier la forme ni les détails du produit.
      </p>
      <div className="mt-4 grid gap-4">
        <button type="button" disabled={!imageReady} className="rounded-full border px-4 py-2 text-sm font-semibold disabled:opacity-50" onClick={autoCorrect}>
          Correction automatique
        </button>
        <label className="grid gap-1 text-sm">
          Lumière <span className="text-xs text-neutral-500">{brightness}%</span>
          <input type="range" min="75" max="130" value={brightness} onChange={(event) => setBrightness(Number(event.target.value))} />
        </label>
        <label className="grid gap-1 text-sm">
          Contraste <span className="text-xs text-neutral-500">{contrast}%</span>
          <input type="range" min="80" max="125" value={contrast} onChange={(event) => setContrast(Number(event.target.value))} />
        </label>
        <label className="grid gap-1 text-sm">
          Netteté <span className="text-xs text-neutral-500">{sharpness}%</span>
          <input type="range" min="0" max="35" value={sharpness} onChange={(event) => setSharpness(Number(event.target.value))} />
        </label>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" className="rounded-full border px-4 py-2 text-sm" onClick={() => { setBrightness(100); setContrast(100); setSharpness(0); }}>
          Réinitialiser
        </button>
        <button type="button" className="rounded-full border px-4 py-2 text-sm" onClick={onCancel}>
          Garder l&apos;original
        </button>
        <button type="button" disabled={busy || !imageReady} className="rounded-full bg-black px-4 py-2 text-sm font-semibold text-white disabled:opacity-50" onClick={() => void apply()}>
          {busy ? "Préparation…" : "Appliquer la retouche"}
        </button>
      </div>
      <p className="mt-3 text-xs text-amber-800">
        Le remplacement du fond sera activé avec un détourage fiable afin de protéger le produit.
      </p>
    </section>
  );
}
