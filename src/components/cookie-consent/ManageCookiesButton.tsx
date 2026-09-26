"use client";

export default function ManageCookiesButton() {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new CustomEvent("revant:open-cookie-prefs"))}
      className="underline"
    >
      Gérer mes cookies
    </button>
  );
}
