import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import "./globals.css";
import "./interaction-performance.css";
import "./revant-editorial.css";
import Footer from "@/components/layout/Footer";
import GlobalDismissibleDetails from "@/components/layout/GlobalDismissibleDetails";
import FloatingBackButton from "@/components/layout/FloatingBackButton";
import CookieConsentBanner from "@/components/cookie-consent/CookieConsentBanner";
import ServiceWorkerRegister from "@/components/pwa/ServiceWorkerRegister";
import NativePushRegistration from "@/components/native/NativePushRegistration";
import NativeOAuthCallbackHandler from "@/components/auth/NativeOAuthCallbackHandler";
import LaunchExperience from "@/components/pwa/LaunchExperience";
import DisplayPreferencesBootstrap from "@/components/layout/DisplayPreferencesBootstrap";
import { getSitePalette } from "@/server/theme/site-palette";

export const metadata: Metadata = {
  title: "Revant",
  description: "Revant — seconde vie, nouvelle valeur",
  manifest: "/manifest.webmanifest",
  applicationName: "Revant",
  appleWebApp: { capable: true, title: "Revant", statusBarStyle: "default" },
  icons: {
    icon: [
      { url: "/images/logo-revant-officiel-192.png?v=20261121-carton-complet", sizes: "192x192", type: "image/png" },
      { url: "/images/logo-revant-officiel-512.png?v=20261121-carton-complet", sizes: "512x512", type: "image/png" },
    ],
    shortcut: "/images/logo-revant-officiel-192.png?v=20261121-carton-complet",
    apple: "/images/logo-revant-officiel-512.png?v=20261121-carton-complet",
  },
};

export async function generateViewport(): Promise<Viewport> {
  const palette = await getSitePalette();
  return {
    width: "device-width",
    initialScale: 1,
    viewportFit: "cover",
    themeColor: palette === "slate-lilac" ? "#0B211A" : "#F36B21",
  };
}

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const palette = await getSitePalette();
  return (
    <html lang="fr" className="h-full antialiased" data-site-palette={palette}>
      <body className="min-h-full flex flex-col bg-brand-bg text-brand-text">
        <DisplayPreferencesBootstrap />
        <GlobalDismissibleDetails />
        <ServiceWorkerRegister />
        <NativePushRegistration />
        <NativeOAuthCallbackHandler />
        <LaunchExperience />
        <Suspense fallback={null}><FloatingBackButton /></Suspense>
        <div className="flex-1 flex flex-col">{children}</div>
        <Footer />
        <CookieConsentBanner />
      </body>
    </html>
  );
}
