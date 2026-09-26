import type { Metadata } from "next";
import "./globals.css";
import Footer from "@/components/layout/Footer";
import CookieConsentBanner from "@/components/cookie-consent/CookieConsentBanner";

export const metadata: Metadata = {
  title: "Revant",
  description: "Revant — seconde vie, nouvelle valeur",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fr" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <div className="flex-1 flex flex-col">{children}</div>
        <Footer />
        <CookieConsentBanner />
      </body>
    </html>
  );
}
