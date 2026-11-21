import type { Metadata, Viewport } from "next";
import "./globals.css";
import "./interaction-performance.css";
import Footer from "@/components/layout/Footer";
import GlobalDismissibleDetails from "@/components/layout/GlobalDismissibleDetails";
import CookieConsentBanner from "@/components/cookie-consent/CookieConsentBanner";
import ServiceWorkerRegister from "@/components/pwa/ServiceWorkerRegister";
import NativePushRegistration from "@/components/native/NativePushRegistration";
import NativeOAuthCallbackHandler from "@/components/auth/NativeOAuthCallbackHandler";
import LaunchExperience from "@/components/pwa/LaunchExperience";
import { getSitePalette } from "@/server/theme/site-palette";

export const metadata: Metadata = {
  title: "Revant",
  description: "Revant — seconde vie, nouvelle valeur",
  manifest: "/manifest.webmanifest",
  applicationName: "Revant",
  appleWebApp: {
    capable: true,
    title: "Revant",
    statusBarStyle: "default",
  },
  icons: {
    icon: [
      { url: "/images/revant-box-mark-192.png?v=20261115", sizes: "192x192", type: "image/png" },
      { url: "/images/revant-box-mark-512.png?v=20261115", sizes: "512x512", type: "image/png" },
    ],
    shortcut: "/images/revant-box-mark-192.png?v=20261115",
    apple: "/images/revant-box-mark-512.png?v=20261115",
  },
};

export async function generateViewport(): Promise<Viewport> {
  const palette = await getSitePalette();
  return {
    width: "device-width",
    initialScale: 1,
    viewportFit: "cover",
    themeColor: palette === "slate-lilac" ? "#101923" : "#D94F0B",
  };
}

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const palette = await getSitePalette();
  return (
    <html lang="fr" className="h-full antialiased" data-site-palette={palette}>
      <body className="min-h-full flex flex-col bg-brand-bg text-brand-text">
        <GlobalDismissibleDetails />
        <ServiceWorkerRegister />
        <NativePushRegistration />
        <NativeOAuthCallbackHandler />
        <LaunchExperience />
        <div className="flex-1 flex flex-col">{children}</div>
        <Footer />
        <CookieConsentBanner />
      </body>
    </html>
  );
}
