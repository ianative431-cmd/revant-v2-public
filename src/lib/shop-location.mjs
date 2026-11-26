/**
 * Affiche le nom du pays au lieu de son code ISO dans la vitrine publique.
 * Les codes ISO 3166-1 alpha-2 sont localisés avec Intl.DisplayNames.
 *
 * @param {string | null | undefined} city
 * @param {string | null | undefined} countryCode
 * @param {string} locale
 * @returns {string}
 */
export function formatShopLocation(city, countryCode, locale = "fr") {
  const cityName = String(city ?? "").trim();
  const code = String(countryCode ?? "").trim().toUpperCase();
  let countryName = code;

  if (/^[A-Z]{2}$/.test(code)) {
    try {
      const displayName = new Intl.DisplayNames([locale], { type: "region" }).of(code);
      if (displayName && !/indéterminée|unknown region/i.test(displayName)) {
        countryName = displayName;
      }
    } catch {
      // Keep the original country code if the runtime cannot localize it.
    }
  }

  return [cityName, countryName].filter(Boolean).join(", ");
}
