import Image from "next/image";
import Link from "next/link";
import { env } from "@/lib/env";
import { generateQrCodeDataUrl } from "@/lib/qr";

export const metadata = {
  title: "QR code de l’application — Revant",
  description: "Scanne le QR code pour ouvrir l’application Revant.",
};

export default async function ApplicationQrPage() {
  const applicationUrl = env.siteUrl().replace(/\/$/, "");
  const qrCodeDataUrl = await generateQrCodeDataUrl(applicationUrl);

  return (
    <main className="flex min-h-[70vh] items-center justify-center bg-brand-bg px-4 py-10">
      <section className="w-full max-w-md rounded-[28px] border border-black/5 bg-white p-6 text-center shadow-sm sm:p-9">
        <Link href="/" aria-label="Retour à l’accueil Revant" className="mx-auto inline-flex rounded-2xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-accent">
          <Image src="/images/logo-revant-app-512.png" alt="Revant" width={64} height={64} priority className="h-16 w-16 object-contain" />
        </Link>
        <p className="mt-5 text-[10px] font-extrabold uppercase tracking-[0.2em] text-neutral-500">Accès officiel</p>
        <h1 className="mt-2 text-2xl font-black tracking-tight text-brand-text sm:text-3xl">Découvrir Revant</h1>
        <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-neutral-600">
          Scanne ce QR code avec l’appareil photo de ton téléphone pour ouvrir la marketplace Revant.
        </p>

        <div className="mx-auto mt-7 w-fit rounded-[24px] border border-neutral-100 bg-white p-3 shadow-sm">
          {/* eslint-disable-next-line @next/next/no-img-element -- QR PNG généré côté serveur */}
          <img src={qrCodeDataUrl} alt="QR code officiel ouvrant l’accueil de l’application Revant" width={240} height={240} className="h-60 w-60 max-w-full" />
        </div>

        <a
          href={qrCodeDataUrl}
          download="revant-qr-application.png"
          className="mt-6 inline-flex min-h-12 w-full items-center justify-center rounded-full bg-brand-accent px-6 py-3 text-sm font-bold text-white transition hover:brightness-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-accent"
        >
          Télécharger le QR code
        </a>
        <p className="mt-4 break-all rounded-xl bg-brand-bg px-3 py-3 text-xs text-neutral-600">{applicationUrl}</p>
        <p className="mt-4 text-xs text-neutral-500">Ce QR code est réservé à l’application. Le QR de chaque boutique reste indépendant dans « Ma boutique ».</p>
        <Link href="/" className="mt-6 inline-block text-sm font-semibold text-brand-text underline underline-offset-4">Retour à l’accueil</Link>
      </section>
    </main>
  );
}
