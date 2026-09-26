"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  COOKIE_CONSENT_SHAPE_VERSION,
  COOKIE_CATEGORY_LABELS,
  defaultCategories,
  readConsentCookieClient,
  writeConsentCookieClient,
  type CookieCategories,
  type CookieConsentRecord,
} from "@/lib/cookie-consent";
import { recordCookieConsentForAccount } from "@/server/legal/cookie-consent-actions";

export default function CookieConsentBanner() {
  const [visible, setVisible] = useState(false);
  const [mode, setMode] = useState<"banner" | "customize">("banner");
  const [categories, setCategories] = useState<CookieCategories>(defaultCategories(false));

  useEffect(() => {
    // La cookie n'existe que côté navigateur : ce useEffect (plutôt qu'un
    // état initial calculé) évite un mismatch d'hydratation SSR, où le
    // serveur ne peut pas savoir si un consentement existe déjà.
    const existing = readConsentCookieClient();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setVisible(!existing);
    if (existing) setCategories(existing.categories);

    function reopen() {
      const current = readConsentCookieClient();
      if (current) setCategories(current.categories);
      setMode("customize");
      setVisible(true);
    }
    window.addEventListener("revant:open-cookie-prefs", reopen);
    return () => window.removeEventListener("revant:open-cookie-prefs", reopen);
  }, []);

  function save(record: Omit<CookieConsentRecord, "shapeVersion" | "consentedAt">) {
    const full: CookieConsentRecord = {
      shapeVersion: COOKIE_CONSENT_SHAPE_VERSION,
      consentedAt: new Date().toISOString(),
      ...record,
    };
    writeConsentCookieClient(full);
    void recordCookieConsentForAccount(full);
    setVisible(false);
    setMode("banner");
  }

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 inset-x-0 z-50 flex justify-center px-4 pb-4">
      <div className="w-full max-w-lg bg-white rounded-[22px] shadow-lg p-5 border border-black/10">
        {mode === "banner" ? (
          <>
            <p className="text-sm mb-4">
              Revant utilise des cookies strictement nécessaires au fonctionnement du service, et,
              avec ton accord, des cookies analytiques, de personnalisation ou publicitaires.{" "}
              <Link href="/legal/cookies" className="underline">
                En savoir plus
              </Link>
              .
            </p>
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                onClick={() => save({ categories: defaultCategories(true), consentType: "accept_all" })}
                className="flex-1 bg-black text-white rounded-full py-2.5 text-sm font-medium"
              >
                Tout accepter
              </button>
              <button
                onClick={() =>
                  save({ categories: defaultCategories(false), consentType: "reject_non_essential" })
                }
                className="flex-1 border border-black rounded-full py-2.5 text-sm font-medium"
              >
                Refuser les non essentiels
              </button>
              <button
                onClick={() => setMode("customize")}
                className="flex-1 bg-black/5 rounded-full py-2.5 text-sm font-medium"
              >
                Personnaliser
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="text-sm font-semibold mb-3">Préférences cookies</p>
            <div className="flex flex-col gap-3 mb-4 max-h-64 overflow-y-auto">
              {(Object.keys(COOKIE_CATEGORY_LABELS) as (keyof CookieCategories)[]).map((key) => {
                const meta = COOKIE_CATEGORY_LABELS[key];
                const isNecessary = key === "necessary";
                return (
                  <label key={key} className="flex items-start gap-3 text-sm">
                    <input
                      type="checkbox"
                      checked={categories[key] as boolean}
                      disabled={isNecessary}
                      onChange={(e) =>
                        setCategories((prev) => ({ ...prev, [key]: e.target.checked }))
                      }
                      className="mt-1"
                    />
                    <span>
                      <span className="font-medium">{meta.label}</span>
                      {isNecessary && <span className="text-black/40"> (toujours actif)</span>}
                      <br />
                      <span className="text-black/60">{meta.description}</span>
                    </span>
                  </label>
                );
              })}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setMode("banner")}
                className="flex-1 bg-black/5 rounded-full py-2.5 text-sm font-medium"
              >
                Retour
              </button>
              <button
                onClick={() => save({ categories, consentType: "custom" })}
                className="flex-1 bg-black text-white rounded-full py-2.5 text-sm font-medium"
              >
                Enregistrer mes choix
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
