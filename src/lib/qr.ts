import "server-only";
import QRCode from "qrcode";

/**
 * Génère un véritable QR code (image PNG encodée en data URL) pointant
 * vers l'URL fournie — jamais une image décorative statique (règle
 * générale du prompt maître, section 4 : "aucun élément décoratif ne
 * doit être présenté comme une fonctionnalité"). Utilisé pour le QR
 * de boutique (sections 7 et 58).
 */
export async function generateQrCodeDataUrl(targetUrl: string): Promise<string> {
  return QRCode.toDataURL(targetUrl, {
    margin: 1,
    width: 240,
    color: { dark: "#111111", light: "#ffffff" },
  });
}
