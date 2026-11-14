const SOCIAL_HOSTS = {
  instagram: "instagram.com",
  tiktok: "tiktok.com",
  snapchat: "snapchat.com",
};

const SOCIAL_HANDLE_PATTERNS = {
  instagram: /^[A-Za-z0-9._]{1,30}$/,
  tiktok: /^[A-Za-z0-9._]{2,24}$/,
  snapchat: /^[A-Za-z0-9._-]{3,15}$/,
};

/**
 * Normalise un numéro en E.164.
 * Un numéro local est interprété avec l'indicatif du pays de la boutique.
 * @param {string | null | undefined} value
 * @param {string | null} defaultCallingCode
 * @returns {string | null | undefined}
 */
export function normalizeShopPhone(value, defaultCallingCode = "227") {
  const raw = String(value ?? "").trim();
  if (!raw) return null;
  if (!/^[+\d\s().-]+$/.test(raw)) return undefined;

  let compact = raw.replace(/[\s().-]/g, "");
  if (compact.startsWith("00")) {
    compact = "+" + compact.slice(2);
  }

  if (!compact.startsWith("+")) {
    if (!defaultCallingCode || !/^\d{1,3}$/.test(defaultCallingCode)) {
      return undefined;
    }
    let nationalDigits = compact.replace(/\D/g, "");
    if (nationalDigits.startsWith("0")) nationalDigits = nationalDigits.slice(1);
    compact = "+" + defaultCallingCode + nationalDigits;
  }

  const digits = compact.slice(1);
  if (!/^[1-9]\d{6,14}$/.test(digits)) return undefined;
  return "+" + digits;
}

/**
 * Accepte un pseudo ou une URL HTTPS du réseau demandé et renvoie une URL
 * de profil complète. Les domaines externes et les protocoles non HTTPS sont refusés.
 * @param {string | null | undefined} value
 * @param {"instagram" | "tiktok" | "snapchat"} network
 * @returns {string | null | undefined}
 */
export function normalizeShopSocialUrl(value, network) {
  const raw = String(value ?? "").trim();
  if (!raw) return null;

  const expectedHost = SOCIAL_HOSTS[network];
  const handlePattern = SOCIAL_HANDLE_PATTERNS[network];
  if (!expectedHost || !handlePattern) return undefined;

  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(raw)) {
    try {
      const url = new URL(raw);
      const hostAllowed =
        url.hostname === expectedHost ||
        url.hostname.endsWith("." + expectedHost);

      if (
        url.protocol !== "https:" ||
        !hostAllowed ||
        url.username ||
        url.password ||
        url.pathname === "/"
      ) {
        return undefined;
      }
      return url.toString();
    } catch {
      return undefined;
    }
  }

  const handle = raw.replace(/^@/, "");
  if (!handlePattern.test(handle)) return undefined;

  const encodedHandle = encodeURIComponent(handle);
  if (network === "instagram") {
    return "https://www.instagram.com/" + encodedHandle + "/";
  }
  if (network === "tiktok") {
    return "https://www.tiktok.com/@" + encodedHandle;
  }
  return "https://www.snapchat.com/add/" + encodedHandle;
}
