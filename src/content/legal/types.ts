/**
 * Type unique pour tous les documents juridiques de Revant.
 *
 * IMPORTANT — ces textes sont des modèles de démarrage, pas un avis
 * juridique. Ils doivent être vérifiés par un professionnel du droit
 * avant toute exploitation commerciale, et adaptés à chaque juridiction
 * réelle d'exploitation. Voir le champ `legalReviewNeeded` de chaque
 * document pour les points identifiés comme nécessitant cette validation.
 *
 * Toute modification d'un document dont `requiresExplicitConsent` est
 * vrai doit s'accompagner d'une incrémentation de `version` : c'est ce
 * qui déclenche le mécanisme de re-consentement (voir
 * src/server/legal/consent.ts).
 */
export type LegalSection = {
  heading: string;
  body: string[]; // paragraphes courts, un élément par paragraphe
};

export type LegalDocument = {
  slug: string;
  title: string;
  category:
    | "Compte et utilisation"
    | "Confidentialité et cookies"
    | "Vente, paiements et vendeurs"
    | "Sécurité, propriété intellectuelle et marques";
  version: string;
  effectiveDate: string; // ISO (YYYY-MM-DD)
  requiresExplicitConsent: boolean;
  summary: string; // résumé court affiché dans le centre juridique et à l'inscription
  sections: LegalSection[];
  legalReviewNeeded: string[];
};

export const LEGAL_DISCLAIMER =
  "Ce document est un modèle fourni à titre informatif pour la construction de Revant. Il ne constitue pas un avis juridique et ne garantit pas, à lui seul, la conformité de Revant à l'ensemble des lois applicables. Une validation par un professionnel du droit est nécessaire avant tout lancement commercial.";
