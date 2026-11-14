import type { Metadata, Viewport } from "next";
import "./globals.css";
import "./interaction-performance.css";
import Footer from "@/components/layout/Footer";
import GlobalDismissibleDetails from "@/components/layout/GlobalDismissibleDetails";
import CookieConsentBanner from "@/components/cookie-consent/CookieConsentBanner";
import ServiceWorkerRegister from "@/components/pwa/ServiceWorkerRegister";
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
      { url: "/images/logo-revant-app-192.png", sizes: "192x192", type: "image/png" },
      { url: "/images/logo-revant-app-512.png", sizes: "512x512", type: "image/png" },
    ],
    shortcut: "/images/logo-revant-app-192.png",
    apple: "/images/logo-revant-app-512.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F46A18" },
    { media: "(prefers-color-scheme: dark)", color: "#20252B" },
  ],
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const palette = await getSitePalette();
  return (
    <html lang="fr" className="h-full antialiased" data-site-palette={palette}>
      <body className="min-h-full flex flex-col bg-brand-bg text-brand-text">
        <GlobalDismissibleDetails />
        <ServiceWorkerRegister />
        <div className="flex-1 flex flex-col">{children}</div>
        <Footer />
        <CookieConsentBanner />
      </body>
    </html>
  );
}
