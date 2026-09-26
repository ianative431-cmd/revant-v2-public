import type { LegalDocument } from "./types";

const EFFECTIVE_DATE = "2026-09-24";
const CONTACT_EMAIL = "ianative431@gmail.com";

export const LEGAL_DOCUMENTS: LegalDocument[] = [
  {
    slug: "cgu",
    title: "Conditions Générales d'Utilisation",
    category: "Compte et utilisation",
    version: "1.0.0",
    effectiveDate: EFFECTIVE_DATE,
    requiresExplicitConsent: true,
    summary:
      "Les règles générales d'utilisation de Revant : création de compte, rôle de Revant comme intermédiaire, comportement attendu, et renvoi vers les documents complémentaires.",
    sections: [
      {
        heading: "Objet et acceptation",
        body: [
          "Les présentes Conditions Générales d'Utilisation (CGU) régissent l'accès et l'utilisation de la plateforme Revant, marketplace de vente et de revente entre particuliers.",
          "En créant un compte, l'utilisateur accepte les présentes CGU ainsi que la Politique de confidentialité et la Politique de cookies.",
        ],
      },
      {
        heading: "Compte utilisateur",
        body: [
          "La création d'un compte nécessite un numéro de téléphone nigérien (+227) ou une adresse e-mail valide, vérifié avant toute activité de vente ou d'achat.",
          "L'utilisateur est responsable de la confidentialité de ses identifiants et doit signaler toute utilisation non autorisée de son compte.",
        ],
      },
      {
        heading: "Rôle de Revant",
        body: [
          "Revant fournit une plateforme technique permettant la mise en relation entre acheteurs et vendeurs. Sauf mention contraire explicite, Revant n'est pas partie au contrat de vente conclu entre l'acheteur et le vendeur (voir la Politique de vente et d'achat).",
          "Revant facilite le paiement, la sécurisation temporaire des fonds et la résolution des litiges, dans les conditions décrites dans les documents dédiés.",
        ],
      },
      {
        heading: "Documents complémentaires",
        body: [
          "Les présentes CGU sont complétées par : la Politique de vente et d'achat, les Règles applicables aux vendeurs, la Politique relative aux produits interdits, la Politique de contenu utilisateur, la Politique de paiements, la Politique de versements aux vendeurs, la Politique de remboursement et d'annulation, et les règles de suspension de compte.",
        ],
      },
      {
        heading: "Modification des CGU",
        body: [
          "Revant peut modifier les présentes CGU. Toute modification substantielle fait l'objet d'une information des utilisateurs et, lorsque cela est nécessaire, d'une demande de nouvelle acceptation avant de continuer à utiliser certaines fonctionnalités.",
        ],
      },
    ],
    legalReviewNeeded: [
      "Détermination du droit applicable et de la juridiction compétente en cas de litige, selon les pays réels d'exploitation.",
      "Adaptation aux règles de protection des consommateurs applicables au Niger et dans tout autre pays d'exploitation.",
      "Vérification des mentions obligatoires spécifiques une fois la structure juridique de Revant enregistrée.",
    ],
  },

  {
    slug: "confidentialite",
    title: "Politique de confidentialité",
    category: "Confidentialité et cookies",
    version: "1.0.0",
    effectiveDate: EFFECTIVE_DATE,
    requiresExplicitConsent: true,
    summary:
      "Comment Revant traite les données personnelles : quelles données, pourquoi, combien de temps, et comment exercer ses droits (accès, rectification, suppression, export).",
    sections: [
      {
        heading: "Responsable du traitement",
        body: [
          `Revant est responsable du traitement des données personnelles collectées via la plateforme. Pour toute question, contact : ${CONTACT_EMAIL}.`,
        ],
      },
      {
        heading: "Données collectées",
        body: [
          "Données de compte : nom affiché, numéro de téléphone ou e-mail, ville.",
          "Données de transaction : commandes, montants, historique d'achats et de ventes.",
          "Données de vérification d'identité (KYC) pour les vendeurs, lorsque cette vérification est requise (voir la page KYC).",
          "Données techniques : journaux de connexion, informations nécessaires à la sécurité du compte.",
          "Préférences de cookies, telles que définies dans la Politique de cookies.",
        ],
      },
      {
        heading: "Finalités",
        body: [
          "Fournir le service (création de compte, publication d'annonces, commandes, paiements), assurer la sécurité de la plateforme, prévenir la fraude, et respecter les obligations légales applicables.",
        ],
      },
      {
        heading: "Partage des données",
        body: [
          "Les données peuvent être partagées avec des prestataires strictement nécessaires au fonctionnement du service : hébergement (Supabase, Vercel), envoi de SMS de vérification (Twilio), traitement des paiements (prestataire à confirmer), et assistance basée sur l'IA pour le support.",
          "Revant ne vend jamais les données personnelles des utilisateurs à des tiers à des fins publicitaires.",
        ],
      },
      {
        heading: "Durée de conservation",
        body: [
          "Les données sont conservées le temps nécessaire aux finalités décrites ci-dessus et aux obligations légales applicables (notamment comptables et fiscales pour les données de transaction).",
        ],
      },
      {
        heading: "Droits des utilisateurs",
        body: [
          "Chaque utilisateur peut demander l'accès à ses données, leur rectification, leur suppression, ou leur export dans un format lisible.",
          `Ces demandes peuvent être faites directement depuis la section "Confidentialité et données" du compte, ou par e-mail à ${CONTACT_EMAIL}.`,
        ],
      },
      {
        heading: "Sécurité",
        body: [
          "Revant met en œuvre des mesures techniques et organisationnelles pour protéger les données (voir la page Sécurité des comptes et des transactions).",
        ],
      },
    ],
    legalReviewNeeded: [
      "Détermination précise de la base légale de chaque traitement selon le régime de protection des données applicable au Niger et dans les pays concernés.",
      "Évaluation de la nécessité de désigner un délégué à la protection des données.",
      "Vérification des garanties applicables en cas de transfert de données hors du pays de résidence de l'utilisateur.",
    ],
  },

  {
    slug: "cookies",
    title: "Politique relative aux cookies",
    category: "Confidentialité et cookies",
    version: "1.0.0",
    effectiveDate: EFFECTIVE_DATE,
    requiresExplicitConsent: false,
    summary:
      "Les catégories de cookies utilisées par Revant (nécessaires, analytiques, personnalisation, publicité) et comment gérer son consentement à tout moment.",
    sections: [
      {
        heading: "Qu'est-ce qu'un cookie",
        body: [
          "Un cookie est un petit fichier déposé sur l'appareil de l'utilisateur, permettant à un site de mémoriser des informations d'une visite à l'autre.",
        ],
      },
      {
        heading: "Catégories de cookies utilisées",
        body: [
          "Cookies strictement nécessaires : indispensables au fonctionnement du service (session, sécurité, préférences de consentement). Ils ne peuvent pas être désactivés.",
          "Cookies analytiques : mesure d'audience et compréhension de l'usage de la plateforme, pour l'améliorer.",
          "Cookies de personnalisation : mémorisation de préférences d'affichage.",
          "Cookies publicitaires : mesure ou personnalisation de contenus publicitaires, le cas échéant.",
        ],
      },
      {
        heading: "Consentement",
        body: [
          "À l'exception des cookies strictement nécessaires, aucun cookie non essentiel n'est déposé avant que l'utilisateur ait fait un choix explicite via la bannière de consentement.",
          "L'utilisateur peut Tout accepter, Refuser les cookies non essentiels, ou Personnaliser son choix catégorie par catégorie.",
        ],
      },
      {
        heading: "Modifier son choix",
        body: [
          "Le consentement peut être modifié ou retiré à tout moment depuis le centre de préférences, accessible en bas de chaque page ou depuis la section Confidentialité et données du compte.",
        ],
      },
    ],
    legalReviewNeeded: [
      "Mise à jour de la liste exacte des cookies déposés une fois les outils tiers (mesure d'audience, publicité) effectivement choisis et intégrés.",
      "Vérification de la durée de conservation du consentement conforme à la réglementation applicable.",
    ],
  },

  {
    slug: "mentions-legales",
    title: "Mentions légales",
    category: "Compte et utilisation",
    version: "1.0.0",
    effectiveDate: EFFECTIVE_DATE,
    requiresExplicitConsent: false,
    summary: "Informations sur l'éditeur de Revant, l'hébergement, et les moyens de contact.",
    sections: [
      {
        heading: "Éditeur",
        body: [
          "Revant. Les informations complètes d'immatriculation (forme juridique, siège social, numéro d'immatriculation) seront ajoutées ici une fois la structure juridique de Revant officiellement enregistrée.",
        ],
      },
      {
        heading: "Hébergement",
        body: [
          "Le site et l'application sont hébergés via Vercel (frontend) et Supabase (base de données, authentification, stockage).",
        ],
      },
      {
        heading: "Contact",
        body: [`Pour toute question : ${CONTACT_EMAIL}.`],
      },
    ],
    legalReviewNeeded: [
      "Compléter avec l'identité juridique complète de Revant dès son immatriculation (forme, capital, numéro RCCM ou équivalent, siège social).",
      "Ajouter les coordonnées complètes des hébergeurs si requis par la réglementation locale.",
    ],
  },

  {
    slug: "remboursement-annulation",
    title: "Politique de remboursement et d'annulation",
    category: "Vente, paiements et vendeurs",
    version: "1.0.0",
    effectiveDate: EFFECTIVE_DATE,
    requiresExplicitConsent: false,
    summary:
      "Dans quels cas une commande peut être annulée ou remboursée, et comment les fonds mis en séquestre sont traités.",
    sections: [
      {
        heading: "Principe général",
        body: [
          "Les fonds payés par l'acheteur sont conservés temporairement (séquestre) jusqu'à la confirmation de la remise du produit, sauf modalité différente indiquée sur la commande.",
        ],
      },
      {
        heading: "Annulation avant confirmation",
        body: [
          "Une commande peut être annulée avant confirmation de remise, dans les conditions affichées au moment de l'achat.",
        ],
      },
      {
        heading: "Remboursement après litige",
        body: [
          "Si un litige est ouvert et tranché en faveur de l'acheteur, tout ou partie du montant lui est remboursé, selon la décision rendue (voir la Procédure de traitement des litiges).",
        ],
      },
      {
        heading: "Cas non remboursables",
        body: [
          "Un produit conforme à sa description et à son état annoncé, déjà remis à l'acheteur et confirmé par celui-ci, n'est en principe pas remboursable, sauf décision contraire en cas de litige justifié.",
        ],
      },
    ],
    legalReviewNeeded: [
      "Articulation avec un éventuel droit de rétractation légal selon que le vendeur est un particulier ou considéré comme professionnel au regard de la loi applicable.",
    ],
  },

  {
    slug: "vente-achat",
    title: "Politique de vente et d'achat",
    category: "Vente, paiements et vendeurs",
    version: "1.0.0",
    effectiveDate: EFFECTIVE_DATE,
    requiresExplicitConsent: false,
    summary:
      "Comment fonctionne une transaction sur Revant entre un acheteur et un vendeur, et le rôle exact de Revant dans ce processus.",
    sections: [
      {
        heading: "Contrat entre particuliers",
        body: [
          "La vente est conclue directement entre l'acheteur et le vendeur. Revant met à disposition la plateforme et les outils de paiement et de sécurisation, sans être partie au contrat de vente lui-même.",
        ],
      },
      {
        heading: "Obligations du vendeur",
        body: [
          "Décrire fidèlement le produit (état, taille, défauts éventuels), fixer un prix, et procéder à la remise du produit dans les délais annoncés.",
        ],
      },
      {
        heading: "Obligations de l'acheteur",
        body: [
          "Payer le montant indiqué, vérifier le produit à réception, et confirmer la remise dans les délais prévus pour permettre la libération des fonds au vendeur.",
        ],
      },
      {
        heading: "Commission Revant",
        body: [
          "Revant prélève une commission de 0,5 % sur le montant de chaque vente réalisée via la plateforme, avant versement au vendeur.",
        ],
      },
    ],
    legalReviewNeeded: [
      "Qualification juridique exacte du rôle de Revant (simple intermédiaire technique ou responsabilité élargie) selon les juridictions d'exploitation.",
    ],
  },

  {
    slug: "regles-vendeurs",
    title: "Règles applicables aux vendeurs",
    category: "Vente, paiements et vendeurs",
    version: "1.0.0",
    effectiveDate: EFFECTIVE_DATE,
    requiresExplicitConsent: false,
    summary:
      "Ce qu'implique le statut de vendeur sur Revant : vérification d'identité, obligations, personnalisation de boutique, et sanctions possibles.",
    sections: [
      {
        heading: "Devenir vendeur",
        body: [
          "Toute personne titulaire d'un compte Revant vérifié peut publier des annonces. Une vérification d'identité (KYC) est requise avant de pouvoir recevoir des versements (voir la page KYC).",
        ],
      },
      {
        heading: "Obligations",
        body: [
          "Publier des descriptions et photos honnêtes, fixer des prix conformes à la réalité du produit, respecter la Politique relative aux produits interdits, et répondre aux demandes raisonnables des acheteurs.",
        ],
      },
      {
        heading: "Boutique personnalisable",
        body: [
          "Le vendeur peut personnaliser l'apparence de sa boutique (couleurs, bannière). Il reste seul responsable du contenu qu'il y affiche, dans le respect de la Politique de contenu utilisateur.",
        ],
      },
      {
        heading: "Sanctions",
        body: [
          "Le non-respect de ces règles peut entraîner le retrait d'une annonce, une restriction de compte ou une suspension, selon les règles de suspension de compte.",
        ],
      },
    ],
    legalReviewNeeded: [
      "Évaluation d'un éventuel seuil (volume ou fréquence de vente) à partir duquel un vendeur pourrait être considéré comme professionnel au regard de la loi applicable, avec des obligations spécifiques associées.",
    ],
  },

  {
    slug: "produits-interdits",
    title: "Produits interdits, illégaux ou non conformes",
    category: "Vente, paiements et vendeurs",
    version: "1.0.0",
    effectiveDate: EFFECTIVE_DATE,
    requiresExplicitConsent: false,
    summary: "Ce qu'il est interdit de vendre sur Revant, et les conséquences en cas de non-respect.",
    sections: [
      {
        heading: "Catégories interdites",
        body: [
          "Contrefaçons et produits violant des droits de propriété intellectuelle.",
          "Produits volés ou d'origine illicite.",
          "Armes, munitions et produits dangereux réglementés.",
          "Drogues, substances réglementées et médicaments sans autorisation appropriée.",
          "Animaux vivants protégés ou dont la vente est réglementée.",
          "Faux documents officiels.",
          "Tout produit dont la vente est interdite par la loi applicable.",
        ],
      },
      {
        heading: "Conséquences",
        body: [
          "Retrait immédiat de l'annonce concernée, et selon la gravité, restriction ou suspension du compte vendeur. Un signalement aux autorités compétentes peut être effectué lorsque la loi l'exige.",
        ],
      },
      {
        heading: "Signalement",
        body: [
          "Tout produit suspecté d'appartenir à ces catégories peut être signalé via la fonction de signalement (voir la Politique de signalement).",
        ],
      },
    ],
    legalReviewNeeded: [
      "Établir et tenir à jour une liste précise et exhaustive des produits réglementés selon la législation nigérienne et celle de tout autre pays d'exploitation.",
    ],
  },

  {
    slug: "contenu-utilisateur",
    title: "Politique relative au contenu publié par les utilisateurs",
    category: "Compte et utilisation",
    version: "1.0.0",
    effectiveDate: EFFECTIVE_DATE,
    requiresExplicitConsent: false,
    summary:
      "Les règles applicables aux annonces, photos, avis et messages publiés par les utilisateurs sur Revant.",
    sections: [
      {
        heading: "Contenu concerné",
        body: ["Annonces, photos de produits, bannières de boutique, avis et messages échangés sur la plateforme."],
      },
      {
        heading: "Responsabilité",
        body: [
          "Chaque utilisateur est seul responsable du contenu qu'il publie et garantit qu'il dispose des droits nécessaires sur les photos et textes utilisés.",
        ],
      },
      {
        heading: "Contenu interdit",
        body: [
          "Contenu illégal, diffamatoire, trompeur, ou violant les droits d'un tiers (voir la Politique de propriété intellectuelle).",
        ],
      },
      {
        heading: "Licence accordée à Revant",
        body: [
          "En publiant du contenu, l'utilisateur accorde à Revant le droit de l'afficher sur la plateforme dans le cadre normal du fonctionnement du service (affichage des annonces, de la boutique, des avis).",
        ],
      },
      {
        heading: "Modération",
        body: [
          "Revant peut retirer un contenu ne respectant pas ces règles, notamment à la suite d'un signalement.",
        ],
      },
    ],
    legalReviewNeeded: [
      "Préciser l'étendue exacte de la licence accordée à Revant sur le contenu publié (durée, portée géographique).",
    ],
  },

  {
    slug: "signalement",
    title: "Politique de signalement",
    category: "Compte et utilisation",
    version: "1.0.0",
    effectiveDate: EFFECTIVE_DATE,
    requiresExplicitConsent: false,
    summary: "Comment signaler une annonce, un compte, un avis ou un contenu problématique, et comment ces signalements sont traités.",
    sections: [
      {
        heading: "Ce qui peut être signalé",
        body: ["Une annonce, un compte, un avis, un message, ou tout contenu suspecté de violer les règles de Revant."],
      },
      {
        heading: "Traitement du signalement",
        body: [
          "Chaque signalement est examiné. Selon le cas, il peut aboutir au retrait du contenu concerné, à un avertissement, ou à une restriction/suspension du compte concerné (voir les règles de suspension de compte).",
        ],
      },
      {
        heading: "Confidentialité",
        body: ["L'identité de la personne à l'origine d'un signalement est, dans la mesure du possible, protégée."],
      },
      {
        heading: "Abus du système de signalement",
        body: ["Un usage abusif ou de mauvaise foi du système de signalement peut lui-même faire l'objet d'une sanction."],
      },
    ],
    legalReviewNeeded: [],
  },

  {
    slug: "litiges",
    title: "Procédure de traitement des litiges",
    category: "Vente, paiements et vendeurs",
    version: "1.0.0",
    effectiveDate: EFFECTIVE_DATE,
    requiresExplicitConsent: false,
    summary: "Comment un litige entre un acheteur et un vendeur est ouvert, traité, et résolu sur Revant.",
    sections: [
      {
        heading: "Ouverture d'un litige",
        body: [
          "Un acheteur ou un vendeur peut ouvrir un litige lié à une commande, dans le délai indiqué sur celle-ci.",
        ],
      },
      {
        heading: "Gel des fonds",
        body: [
          "L'ouverture d'un litige gèle les fonds correspondants : ils ne sont ni reversés au vendeur ni remboursés à l'acheteur tant que le litige n'est pas résolu.",
        ],
      },
      {
        heading: "Résolution",
        body: [
          "Revant examine les éléments fournis par les deux parties et rend une décision : libération des fonds au vendeur, remboursement total ou partiel à l'acheteur.",
        ],
      },
      {
        heading: "Voies de recours",
        body: [
          "La décision de Revant ne prive pas les parties de leurs éventuels recours prévus par la loi applicable.",
        ],
      },
    ],
    legalReviewNeeded: [
      "Préciser le caractère contraignant ou non de la décision de médiation de Revant selon la loi applicable, et son articulation avec d'éventuels mécanismes de médiation de la consommation obligatoires.",
    ],
  },

  {
    slug: "suspension-compte",
    title: "Suspension, restriction et fermeture de compte",
    category: "Compte et utilisation",
    version: "1.0.0",
    effectiveDate: EFFECTIVE_DATE,
    requiresExplicitConsent: false,
    summary: "Dans quels cas un compte peut être suspendu ou fermé, et ce qu'il advient des fonds en attente.",
    sections: [
      {
        heading: "Motifs",
        body: [
          "Violation des CGU, des règles vendeurs, de la Politique relative aux produits interdits, fraude suspectée, ou absence de vérification d'identité requise.",
        ],
      },
      {
        heading: "Procédure",
        body: [
          "Sauf urgence ou fraude manifeste, l'utilisateur est informé du motif de la mesure prise à l'encontre de son compte.",
        ],
      },
      {
        heading: "Fonds en attente",
        body: [
          "En cas de suspension, les fonds en attente restent bloqués le temps de l'examen de la situation, dans le respect des règles du ledger financier.",
        ],
      },
      {
        heading: "Fermeture volontaire",
        body: ["Un utilisateur peut demander la fermeture de son compte à tout moment depuis la section Confidentialité et données."],
      },
    ],
    legalReviewNeeded: [],
  },

  {
    slug: "paiements",
    title: "Politique de paiements",
    category: "Vente, paiements et vendeurs",
    version: "1.0.0",
    effectiveDate: EFFECTIVE_DATE,
    requiresExplicitConsent: false,
    summary:
      "Les rôles respectifs de Revant, du prestataire de paiement et du vendeur, et pourquoi Revant ne stocke jamais les données de carte bancaire.",
    sections: [
      {
        heading: "Rôles respectifs",
        body: [
          "Revant : plateforme technique organisant le paiement et la mise en séquestre des fonds. Le prestataire de paiement : traite effectivement la transaction et les données de carte, de manière sécurisée. Le vendeur : bénéficiaire final du montant de la vente, après commission.",
        ],
      },
      {
        heading: "Aucune donnée de carte stockée",
        body: [
          "Revant ne stocke jamais directement de données de carte bancaire. Ces données sont traitées uniquement par le prestataire de paiement, dans le cadre de ses propres standards de sécurité.",
        ],
      },
      {
        heading: "Séquestre",
        body: [
          "Le montant payé par l'acheteur est conservé temporairement jusqu'à confirmation de remise du produit (voir la Politique de remboursement et d'annulation).",
        ],
      },
      {
        heading: "Prestataire utilisé",
        body: [
          "Le prestataire de paiement effectivement utilisé sera précisé ici une fois confirmé, après vérification de sa couverture réelle du Niger.",
        ],
      },
    ],
    legalReviewNeeded: [
      "Vérifier le statut réglementaire exact requis (établissement de paiement, agrégateur agréé) selon le prestataire finalement retenu.",
    ],
  },

  {
    slug: "payouts",
    title: "Politique de versements aux vendeurs (payouts)",
    category: "Vente, paiements et vendeurs",
    version: "1.0.0",
    effectiveDate: EFFECTIVE_DATE,
    requiresExplicitConsent: false,
    summary: "Comment et quand un vendeur reçoit l'argent de ses ventes, et quelles vérifications s'appliquent avant un versement.",
    sections: [
      {
        heading: "Libération des fonds",
        body: [
          "Le montant d'une vente devient disponible pour le vendeur après confirmation de la remise du produit à l'acheteur, ou après un délai de sécurité en l'absence de litige.",
        ],
      },
      {
        heading: "Commission",
        body: ["Une commission de 0,5 % est déduite du montant de la vente avant que le solde restant ne devienne disponible."],
      },
      {
        heading: "Demande de versement",
        body: [
          "Le vendeur peut demander le versement de son solde disponible vers son compte Mobile Money ou bancaire, selon les moyens proposés par Revant.",
        ],
      },
      {
        heading: "Contrôles préalables",
        body: [
          "Un versement peut être suspendu ou retardé si la vérification d'identité (KYC) du vendeur n'est pas complète, ou en cas de suspicion de fraude.",
        ],
      },
      {
        heading: "Délais",
        body: ["Les délais de versement dépendent du prestataire retenu et seront précisés une fois celui-ci confirmé."],
      },
    ],
    legalReviewNeeded: [],
  },

  {
    slug: "kyc",
    title: "Vérification d'identité (KYC)",
    category: "Vente, paiements et vendeurs",
    version: "1.0.0",
    effectiveDate: EFFECTIVE_DATE,
    requiresExplicitConsent: false,
    summary: "Pourquoi Revant vérifie l'identité de certains vendeurs, quelles informations sont demandées, et ce qui se passe si la vérification échoue.",
    sections: [
      {
        heading: "Pourquoi",
        body: ["La vérification d'identité (KYC) permet de lutter contre la fraude et de respecter les obligations applicables aux versements d'argent."],
      },
      {
        heading: "Quand elle est requise",
        body: ["Avant l'activation des versements (payouts) pour un compte vendeur."],
      },
      {
        heading: "Informations demandées",
        body: ["Une pièce d'identité et, selon le prestataire de vérification retenu, un justificatif complémentaire (par exemple un selfie de vérification)."],
      },
      {
        heading: "Conservation des données",
        body: [
          "Les documents fournis sont stockés de manière sécurisée, dans un espace d'accès strictement limité, pour une durée limitée à ce qui est nécessaire.",
        ],
      },
      {
        heading: "Conséquences d'une vérification incomplète",
        body: [
          "Tant que la vérification n'est pas complète ou est refusée, les versements au vendeur concerné restent bloqués. Les ventes peuvent continuer à être publiées selon les règles en vigueur, mais les fonds resteront en attente.",
        ],
      },
    ],
    legalReviewNeeded: [
      "Confirmer le prestataire de vérification d'identité retenu et les garanties associées à la conservation des documents.",
    ],
  },

  {
    slug: "securite-comptes",
    title: "Sécurité des comptes et des transactions",
    category: "Sécurité, propriété intellectuelle et marques",
    version: "1.0.0",
    effectiveDate: EFFECTIVE_DATE,
    requiresExplicitConsent: false,
    summary: "Les mesures de sécurité mises en place par Revant, et les bonnes pratiques attendues de chaque utilisateur.",
    sections: [
      {
        heading: "Mesures en place",
        body: [
          "Mots de passe jamais stockés en clair, sessions sécurisées, vérification du numéro de téléphone par SMS, connexions chiffrées (HTTPS).",
        ],
      },
      {
        heading: "Responsabilité de l'utilisateur",
        body: ["Garder ses identifiants confidentiels et signaler immédiatement tout accès suspect à son compte."],
      },
      {
        heading: "Communication officielle",
        body: ["Revant ne demande jamais un mot de passe ou un code de vérification par e-mail ou par SMS."],
      },
    ],
    legalReviewNeeded: [],
  },

  {
    slug: "propriete-intellectuelle",
    title: "Propriété intellectuelle et signalement de violations",
    category: "Sécurité, propriété intellectuelle et marques",
    version: "1.0.0",
    effectiveDate: EFFECTIVE_DATE,
    requiresExplicitConsent: false,
    summary: "Comment signaler une violation de droit d'auteur ou de marque sur Revant, et comment ces signalements sont traités.",
    sections: [
      {
        heading: "Propriété de Revant",
        body: ["La marque, le logo et les éléments visuels de Revant sont la propriété de Revant et ne peuvent être utilisés sans autorisation."],
      },
      {
        heading: "Respect des droits de tiers",
        body: ["Chaque utilisateur s'engage à respecter les droits de propriété intellectuelle des tiers dans le contenu qu'il publie."],
      },
      {
        heading: "Signaler une violation",
        body: [
          `Le titulaire d'un droit qui estime qu'un contenu publié sur Revant y porte atteinte peut le signaler via la fonction de signalement ou par e-mail à ${CONTACT_EMAIL}, en fournissant les éléments permettant d'identifier le contenu et le droit concerné.`,
        ],
      },
      {
        heading: "Traitement",
        body: ["Revant examine le signalement et peut retirer le contenu concerné. L'auteur du contenu peut être informé et, le cas échéant, contester la mesure."],
      },
    ],
    legalReviewNeeded: [
      "Mettre en place une procédure formelle de notification et de retrait conforme au cadre légal applicable dans les pays d'exploitation de Revant.",
    ],
  },

  {
    slug: "marques-produits",
    title: "Règles concernant les marques présentes sur les fiches produits",
    category: "Sécurité, propriété intellectuelle et marques",
    version: "1.0.0",
    effectiveDate: EFFECTIVE_DATE,
    requiresExplicitConsent: false,
    summary:
      "Comment le nom d'une marque peut apparaître sur une fiche produit d'occasion, et dans quelles conditions un lien vers le site officiel de la marque est affiché.",
    sections: [
      {
        heading: "Mention d'une marque identifiée",
        body: [
          "Lorsqu'un produit d'occasion authentique correspond à une marque identifiable, son nom peut être mentionné sur la fiche produit à des fins de description, dans le cadre habituel de la revente d'articles de seconde main.",
        ],
      },
      {
        heading: "Lien vers le site officiel",
        body: [
          "Lorsqu'un site officiel de la marque est disponible et pertinent, un lien vers celui-ci peut être affiché, à titre purement informatif.",
        ],
      },
      {
        heading: "Aucune affiliation implicite",
        body: [
          "L'affichage du nom d'une marque ou d'un lien vers son site officiel ne signifie en aucun cas un partenariat, un parrainage ou une affiliation entre Revant et cette marque.",
        ],
      },
      {
        heading: "Retrait sur demande",
        body: [
          "En cas de demande légitime du titulaire d'une marque, Revant peut retirer ou ajuster l'affichage concerné (voir la Politique de propriété intellectuelle).",
        ],
      },
    ],
    legalReviewNeeded: [
      "Analyse juridique de la règle d'épuisement du droit de marque applicable à la revente de produits d'occasion authentiques dans les juridictions concernées, et de sa distinction avec la vente de contrefaçons.",
    ],
  },
];

export function getLegalDocument(slug: string) {
  return LEGAL_DOCUMENTS.find((d) => d.slug === slug) ?? null;
}

export function getLegalDocumentsByCategory() {
  const categories = new Map<string, LegalDocument[]>();
  for (const doc of LEGAL_DOCUMENTS) {
    const list = categories.get(doc.category) ?? [];
    list.push(doc);
    categories.set(doc.category, list);
  }
  return categories;
}
