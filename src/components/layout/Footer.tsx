import Link from "next/link";
import ManageCookiesButton from "@/components/cookie-consent/ManageCookiesButton";

export default function Footer() {
  return (
    <footer className="bg-white border-t border-black/10 px-4 py-6 mt-auto">
      <div className="max-w-2xl mx-auto flex flex-wrap gap-x-5 gap-y-2 text-xs text-black/60">
        <Link href="/legal" className="underline">
          Centre juridique
        </Link>
        <Link href="/legal/cgu" className="underline">
          CGU
        </Link>
        <Link href="/legal/confidentialite" className="underline">
          Confidentialité
        </Link>
        <Link href="/legal/cookies" className="underline">
          Cookies
        </Link>
        <Link href="/legal/mentions-legales" className="underline">
          Mentions légales
        </Link>
        <Link href="/legal/remboursement-annulation" className="underline">
          Remboursement
        </Link>
        <ManageCookiesButton />
        <a href="mailto:ianative431@gmail.com" className="underline">
          Contact
        </a>
      </div>
      <p className="max-w-2xl mx-auto text-xs text-black/40 mt-3">© Revant</p>
    </footer>
  );
}
