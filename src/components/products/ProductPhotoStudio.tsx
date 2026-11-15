"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  file: File;
  onApply: (file: File) => void;
  onCancel: () => void;
};

export default function ProductPhotoStudio({ file, onApply, onCancel }: Props) {
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [sharpness, setSharpness] = useState(0);
  const [busy, setBusy] = useState(false);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const sourceUrl = useRef<string | null>(null);

  useEffect(() => {
    const url = URL.createObjectURL(file);
    sourceUrl.current = url;
    const image = new Image();
    image.onload = () => { imageRef.current = image; drawPreview(); };
    image.src = url;
    return () => { URL.revokeObjectURL(url); sourceUrl.current = null; imageRef.current = null; };
    // The source image changes only when the selected photo changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file]);

  function drawPreview() {
    const image = imageRef.current;
    const canvas = canvasRef.current;
    if (!image || !canvas) return;
    const scale = Math.min(1, 1000 / Math.max(image.naturalWidth, image.naturalHeight));
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
          for (let c = 0; c < 3; c++) {
            const neighbors = data[i - 4 + c] + data[i + 4 + c] + data[i - canvas.width * 4 + c] + data[i + canvas.width * 4 + c];
            target[i + c] = Math.max(0, Math.min(255, data[i + c] + amount * (4 * data[i + c] - neighbors) * 0.25));
          }
        }
      }
      ctx.putImageData(output, 0, 0);
    }
  }

  useEffect(() => { drawPreview(); }, [brightness, contrast, sharpness]);

  async function apply() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setBusy(true);
    try {
      const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob(value => value ? resolve(value) : reject(new Error("Export impossible")), "image/jpeg", 0.92));
      onApply(new File([blob], file.name.replace(/\.[^.]+$/, "") + "-revant.jpg", { type: "image/jpeg", lastModified: Date.now() }));
    } catch {
      setBusy(false);
    }
  }

  return (
    <section className="rounded-2xl border border-neutral-200 bg-white p-4 text-neutral-900" aria-label="Studio photo Revant">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div><p className="text-base font-semibold">Studio photo Revant</p><p className="text-xs text-neutral-500">Retouche locale · original conservé</p></div>
        <span className="rounded-full bg-emerald-50 px-2 py-1 text-xs text-emerald-800">Sans IA générative</span>
      </div>
      <div className="overflow-hidden rounded-xl bg-neutral-100">
        <canvas ref={canvasRef} className="block max-h-[360px] w-full object-contain" aria-label="Aperçu de la photo retouchée" />
      </div>
      <p className="mt-2 text-xs text-neutral-500">Ajuste doucement : une correction trop forte peut donner une représentation inexacte du produit.</p>
      <div className="mt-4 grid gap-4">
        <label className="grid gap-1 text-sm">Lumière <span className="text-xs text-neutral-500">{brightness}%</span><input type="range" min="75" max="130" value={brightness} onChange={e => setBrightness(Number(e.target.value))} /></label>
        <label className="grid gap-1 text-sm">Contraste <span className="text-xs text-neutral-500">{contrast}%</span><input type="range" min="80" max="125" value={contrast} onChange={e => setContrast(Number(e.target.value))} /></label>
        <label className="grid gap-1 text-sm">Netteté <span className="text-xs text-neutral-500">{sharpness}%</span><input type="range" min="0" max="35" value={sharpness} onChange={e => setSharpness(Number(e.target.value))} /></label>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" className="rounded-full border px-4 py-2 text-sm" onClick={() => { setBrightness(100); setContrast(100); setSharpness(0); }}>Réinitialiser</button>
        <button type="button" className="rounded-full border px-4 py-2 text-sm" onClick={onCancel}>Garder l'original</button>
        <button type="button" disabled={busy} className="rounded-full bg-black px-4 py-2 text-sm font-semibold text-white disabled:opacity-50" onClick={() => void apply()}>{busy ? "Préparation…" : "Appliquer la retouche"}</button>
      </div>
      <p className="mt-3 text-xs text-amber-800">Le nettoyage automatique du fond n'est pas activé dans cette première version : Revant ne supprimera pas d'élément sans distinguer sûrement le fond du produit.</p>
    </section>
  );
}
