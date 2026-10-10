import type { Metadata } from "next";
import "./globals.css";
import Footer from "@/components/layout/Footer";
import CookieConsentBanner from "@/components/cookie-consent/CookieConsentBanner";
import { getSitePalette } from "@/server/theme/site-palette";

export const metadata: Metadata = {
  title: "Revant",
  description: "Revant — seconde vie, nouvelle valeur",
  icons: { icon: "/images/logo-revant.svg", shortcut: "/images/logo-revant.svg", apple: "/images/logo-revant.svg" },
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const palette = await getSitePalette();
  return <html lang="fr" className="h-full antialiased" data-site-palette={palette}><body className="min-h-full flex flex-col bg-brand-bg text-brand-text"><div className="flex-1 flex flex-col">{children}</div><Footer/><CookieConsentBanner/></body></html>;
}
