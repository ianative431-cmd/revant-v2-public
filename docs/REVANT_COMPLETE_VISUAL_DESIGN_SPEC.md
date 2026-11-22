# Revant — spécification complète d'intégration visuelle

## Objectif et périmètre

Reproduire dans l'application Revant les références visuelles présentées dans la conversation, pour tous les écrans et états listés ci-dessous. Les références sont des illustrations conceptuelles : elles guident la composition, la hiérarchie, les composants et le style, mais ne fournissent pas de fichiers Figma, de mesures exactes ni d'assets d'interface exportables. L'intégration doit donc les reproduire fidèlement et de façon cohérente, sans prétendre à une identité pixel-perfect mesurable à partir d'images sources absentes.

Cette spécification est créée sur une branche isolée. Aucun déploiement ni changement de production n'est autorisé dans cette étape.

## Règles non négociables

- Conserver l'identité officielle Revant, le logo, les routes et les fonctions déjà opérationnelles.
- Ne jamais remplacer une donnée réelle par un produit, une boutique, une note, un paiement, un stock ou une livraison fictifs.
- Respecter le système de thème déjà présent et vérifier les variables réelles avant d'ajouter des tokens.
- Interfaces adaptatives mobile et ordinateur, accessibles au clavier, avec états de chargement, vide, erreur et indisponibilité.
- Les commandes, paiements, stocks, remboursements et livraisons restent contrôlés côté serveur.
- Les recommandations utilisent une pagination progressive sans plafond éditorial arbitraire; elles s'arrêtent proprement lorsqu'il n'existe plus de résultats.
- Préserver les journaux financiers et d'audit; aucune opération financière ne doit être effacée ou validée par une simple action visuelle.
- Toute intégration passe par une branche, des tests, une revue du diff et une validation avant fusion. Aucun déploiement automatique ou manuel sans étape de validation distincte.

## Références visuelles à intégrer — inventaire exhaustif

### A. Acheteur et découverte
1. **Fiche produit** — grande galerie et miniatures, image principale, nom, catégorie, prix FCFA, disponibilité, variantes, quantité, boutique, description, caractéristiques, avis, actions d'achat fixes sur mobile.
2. **Produits similaires** — grille adaptative, cartes homogènes, recommandations pertinentes et chargement progressif au défilement.
3. **Vous pourriez aussi aimer / Découvrir sur Revant** — recommandations complémentaires et découverte élargie, sans doublons ni produits non achetables.
4. **Panier** — cartes d'articles avec image, boutique, variantes, prix, quantité, suppression, sous-totaux, livraison, réductions et total explicite; séparation visuelle des vendeurs.
5. **Achat direct** — flux de commande initié depuis la fiche produit, sans détour obligatoire par le panier.
6. **Validation de commande** — adresse, instructions et repères, mode de livraison, paiement réellement activé, récapitulatif final et consentement explicite.
7. **Confirmation de commande** — référence, date, montant et statut exact, récapitulatif et accès au suivi.
8. **Liste Mes commandes** — filtres par statut, cartes compactes, aperçu des produits, boutique, date, total et accès aux détails.
9. **Détail et suivi de commande** — chronologie alimentée par événements vérifiés, adresse, transporteur/livreur si disponible, preuves et informations de contact permises.
10. **Annulation** — motifs, éligibilité selon état réel, confirmation et historique; aucune suppression de commande engagée.
11. **Retour et remboursement** — sélection des articles, motif, description, pièces jointes, états du dossier et confirmation financière réelle.
12. **Litiges et assistance** — ouverture d'un dossier, numéro de référence, preuves, échanges, statut, décision et traçabilité.

### B. Vendeur
13. **Tableau de bord Ma boutique** — commandes à traiter, produits actifs, ruptures, messages, évaluations et métriques réelles, avec distinction entre chiffre d'affaires, fonds en attente et fonds disponibles.
14. **Gestion des commandes vendeur** — onglets par statut, détail des lignes, variantes, adresse strictement nécessaire, état de paiement non modifiable manuellement et actions permises selon le rôle.
15. **Catalogue vendeur** — liste de produits, photos, prix, variantes, stock, statut de publication, création et édition.
16. **Gestion de la vitrine** — logo, bannière, nom, description, catégories, localisation, contacts et badges accordés selon critères vérifiés.
17. **Messagerie vendeur** — boîte de réception, contexte produit/commande, notifications, pièces jointes autorisées et signalements.
18. **Calendrier commercial** — calendrier de publications et promotions; programmation externe uniquement avec API officielle et autorisations effectives.

### C. Livraison
19. **Tableau de bord livreur** — missions disponibles/attribuées/en cours/terminées, historique, rémunérations et profil.
20. **Détail d'une mission et navigation** — points de collecte et destination, instructions minimales nécessaires, statut et attribution atomique à un seul livreur.
21. **Prise en charge et progression** — prêt à récupérer, colis récupéré, en route, arrivé, remis, avec événements horodatés.
22. **Preuve de livraison** — OTP comme mécanisme principal proposé, signature/photo comme preuves complémentaires selon règles et consentement.
23. **Incident de livraison** — destinataire absent, adresse introuvable, refus, dommage ou autre incident, justificatifs et résolution.
24. **Administration des livreurs** — vérification, zones, activation, suspension, affectations, incidents et rémunérations, sans accès financier global.

### D. Services transversaux
25. **Centre de notifications** — catégories commandes, paiement, livraison, messages, promotions, sécurité et annonces officielles; historique persistant.
26. **Préférences de notifications** — réglage des canaux et notifications commerciales; conservation des alertes essentielles.
27. **Fidélité et récompenses** — solde de points, historique, règles, avantages et niveaux configurables; retrait des points selon annulation/remboursement.
28. **Coupons et promotions** — portefeuille de coupons, conditions, validité, restrictions, usages et calcul validé côté serveur.
29. **Avis et évaluations** — produit, boutique et livraison; achat vérifié, réponse vendeur, signalement et modération.
30. **Recherche et recommandations** — résultats produits/boutiques/catégories, filtres et suggestions pertinentes, données réelles et pagination.
31. **Supervision Super Admin** — tableaux de contrôle utilisateurs, boutiques, produits, commandes, finance, livreurs, litiges, fidélité, promotions, sécurité, audit et configuration; permissions segmentées.

## Direction visuelle commune

- Réutiliser les tokens et composants existants avant toute création.
- Préserver la palette officielle actuellement configurée dans l'application; ne pas remplacer arbitrairement les thèmes Terracotta et Slate-Lilac existants.
- Hiérarchie claire : média/visuel principal, titre, prix/statut, informations secondaires, actions principales.
- Cartes avec rayons cohérents, bordures discrètes, ombres légères et espaces réguliers.
- Actions principales visibles et contrastées; barre d'action fixe sur mobile lorsqu'elle est utile et sans masquer le contenu.
- Typographie et densité adaptées aux écrans mobiles; grille deux colonnes pour les produits sur téléphone lorsque la largeur le permet.
- Images de produits et de boutiques provenant exclusivement des données et médias réellement stockés.
- États vides, erreurs, chargements, stock épuisé et indisponibilités dessinés avec le même niveau de soin que les états remplis.

## Audit initial du dépôt (branche main au commit 68454e1156fa94fa859cd03ce4835ec2ce220af3)

- Stack observée dans package.json : Next.js 16.4.6, React 19.3.1, Tailwind CSS 4, Supabase SSR/JS, Capacitor.
- Routes déjà présentes notamment : /produit/[id], /panier, /commande, /compte, /boutiques, /shop/[slug], /messages et /admin.
- Composants existants : ProductGallery, ProductCard, AddToCartButton, InfiniteProductFeed et CartPage.
- La fiche produit existante charge un produit actif réel depuis Supabase, montre une galerie, un prix, un état de stock, certaines variantes de taille, une description, la boutique et des actions d'achat. L'audit détaillé de toutes les sections et du bas de page reste à effectuer avant modification.
- CartPage utilise actuellement localStorage pour conserver les lignes et expose une commande article par article; ce comportement ne réalise pas encore le panier multi-boutiques consolidé décrit dans la conception. Il faut vérifier les contrats serveur avant de le faire évoluer.
- Les tokens CSS de marque sont déjà centralisés dans src/app/globals.css. Ne pas introduire une seconde palette concurrente.
- Les services serveur contiennent déjà des domaines orders, delivery, notifications, ledger, shops et products. Leur couverture réelle doit être auditée avant d'ajouter des tables ou des actions.

## Ordre d'intégration proposé

1. Inventaire des routes, composants, schémas Supabase, Server Actions, politiques RLS et tests existants.
2. Matrice fonctionnalité/route/composant/données/état : existant, partiel, absent, bloqué.
3. Système visuel partagé et composants communs, sans régression des pages existantes.
4. Fiche produit et recommandations.
5. Panier, achat direct et validation.
6. Confirmation, commandes, suivi, annulations, retours et litiges.
7. Espace vendeur.
8. Espace livreur.
9. Notifications, fidélité, coupons, avis et recherche.
10. Supervision et permissions.
11. Tests unitaires/intégration, accessibilité, responsive, tests de parcours et revue visuelle.
12. Pull request et validation. Le déploiement reste une opération distincte et non automatique.

## Critères de fin

- Chaque élément de l'inventaire 1 à 31 est associé à une route ou un composant concret.
- Chaque écran a ses états chargement/vide/erreur/normal.
- Aucun contenu de démonstration n'est présenté comme une donnée réelle.
- Les contrôles sensibles sont exécutés côté serveur avec autorisations vérifiées.
- Les parcours acheteur/vendeur/livreur sont cohérents entre eux.
- Les tests passent et aucune régression connue n'est introduite.
- Une revue visuelle mobile et desktop confirme la cohérence avec les références.
- Aucune mise en production sans validation explicite de la version finale.
