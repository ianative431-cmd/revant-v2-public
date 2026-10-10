import type { Metadata, Viewport } from "next";
import "./globals.css";
import Footer from "@/components/layout/Footer";
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
    icon: "/images/logo-revant.svg",
    shortcut: "/images/logo-revant.svg",
    apple: "/images/logo-revant.svg",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#803e2f" },
    { media: "(prefers-color-scheme: dark)", color: "#3e3d38" },
  ],
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const palette = await getSitePalette();
  return (
    <html lang="fr" className="h-full antialiased" data-site-palette={palette}>
      <body className="min-h-full flex flex-col bg-brand-bg text-brand-text">
        <ServiceWorkerRegister />
        <div className="flex-1 flex flex-col">{children}</div>
        <Footer />
        <CookieConsentBanner />
      </body>
    </html>
  );
}