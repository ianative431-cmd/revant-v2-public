import { redirect } from "next/navigation";

/**
 * Ancienne URL conservée pour les favoris et liens historiques.
 * Le calendrier canonique est /compte/boutique/reseaux.
 */
export default function LegacyCalendrierSocialPage(): never {
  redirect("/compte/boutique/reseaux");
}
