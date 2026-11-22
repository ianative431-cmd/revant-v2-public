# Revant — suivi des 31 expériences

Ce tableau reprend sans réduction l'inventaire de `docs/REVANT_COMPLETE_VISUAL_DESIGN_SPEC.md`. « Refonte partielle » signifie qu'une première couche visuelle est présente, pas que le parcours a été entièrement validé. Aucun écran n'est déclaré visuellement validé sans capture réelle.

| # | Expérience | Route ou composant repéré | État de refonte | Preuve visuelle |
|---:|---|---|---|---|
| 1 | Fiche produit | `/produit/[id]` | Refonte partielle : colonne achat, galerie et prix éditorialisés | À capturer |
| 2 | Produits similaires | `ProductCard` / recommandations | Refonte partielle des cartes et de la grille partagée | À capturer |
| 3 | Découvrir sur Revant | Accueil `/` / `InfiniteProductFeed` | Première tranche éditoriale : hero, navigation, catégories, boutiques et grille | À capturer |
| 4 | Panier | `/panier` | Refonte partielle : groupes vendeur et hiérarchie du panier | À capturer |
| 5 | Achat direct | `/commande/visiteur` | Refonte partielle : panneau et formulaire responsive | À capturer |
| 6 | Validation de commande | `/commande/visiteur` | Refonte partielle : structure de formulaire et états conservés | À capturer |
| 7 | Confirmation de commande | `/commande/confirmation` | Refonte partielle : panneau de confirmation et statut | À capturer |
| 8 | Liste Mes commandes | `/compte/commandes` | Refonte partielle : cartes et hiérarchie de suivi | À capturer |
| 9 | Détail et suivi de commande | `/compte/commandes/[id]` | Refonte partielle : statut, articles, historique et adresse | À capturer |
| 10 | Annulation | `/compte/commandes/[id]` → `BuyerOrderActions` → `cancelBuyerOrder` | Fonction existante : annulation acheteur limitée au statut `pending`, contrôle serveur via RPC ; présentation à harmoniser | À capturer |
| 11 | Retour et remboursement | Statuts `refunded` dans le suivi ; aucun parcours acheteur dédié repéré | Non implémenté comme parcours complet : ne pas ajouter de formulaire sans contrat serveur et règles de remboursement | À spécifier |
| 12 | Litiges et assistance | `/admin/signalements`, statut de commande `disputed` | Modération des signalements existante ; parcours de litige acheteur/vendeur et dossier d’assistance dédié non confirmés | À capturer / à spécifier |
| 13 | Tableau de bord Ma boutique | `/compte/boutique` | Refonte partielle : indicateurs et espace de gestion vendeur | À capturer |
| 14 | Gestion des commandes vendeur | `/compte/boutique/commandes` | Refonte partielle : cartes et hiérarchie opérationnelle | À capturer |
| 15 | Catalogue vendeur | `/compte/boutique/produits` | Refonte partielle : conteneur et grille de gestion | À capturer |
| 16 | Gestion de la vitrine | `/compte/boutique/personnaliser`, `/shop/[slug]` | Vitrine publique : bannière, identité, navigation et produits (première couche) | À capturer |
| 17 | Messagerie vendeur | `/messages`, `/messages/[conversationId]` | Refonte partielle : liste des conversations et fil de discussion | À capturer |
| 18 | Calendrier commercial | `/compte/boutique/reseaux` (URL historique redirigée) | Refonte partielle du shell calendrier | À capturer |
| 19 | Tableau de bord livreur | `/compte/livraisons` | Refonte partielle : missions et états de livraison mobile-first | À capturer |
| 20 | Détail d'une mission et navigation | `/compte/livraisons` — cartes des missions attribuées | Détail intégré dans la liste, adresses visibles après attribution ; aucune route cartographique/navigation distincte repérée | À capturer |
| 21 | Prise en charge et progression | `/compte/livraisons` | Refonte partielle des zones d’action | À capturer |
| 22 | Preuve de livraison | `/compte/livraisons` | Parcours existant, QA visuelle à faire | À capturer |
| 23 | Incident de livraison | `/compte/livraisons` | Refonte partielle des cartes d’incident | À capturer |
| 24 | Administration des livreurs | `/admin/livraisons` | Refonte partielle : tableau et panneau opérationnel | À capturer |
| 25 | Centre de notifications | `/compte/notifications` | Refonte partielle : cartes, hiérarchie et états de lecture | À capturer |
| 26 | Préférences de notifications | `/parametres` | Refonte partielle : groupes de réglages et navigation | À capturer |
| 27 | Fidélité et récompenses | Aucune route ou service de fidélité identifié | Non implémenté/à concevoir avec règles, ledger de points et contrats serveur avant interface | À spécifier |
| 28 | Coupons et promotions | `/admin/promotions` | Administration des placements sponsorisés repérée ; portefeuille et application de coupons acheteur non confirmés | À capturer / à spécifier |
| 29 | Avis et évaluations | `/admin/avis`, section produit | Refonte partielle : présentation des avis sur la fiche produit | À capturer |
| 30 | Recherche et recommandations | `/`, `/recherche-photo`, `/categories` | Navigation de recherche et découverte retravaillées partiellement | À capturer |
| 31 | Supervision Super Admin | `/admin` et modules `/admin/**` | Première couche visuelle sur le tableau de bord ; modules à traiter | À capturer |

## État de validation
- Tests unitaires après la première tranche : 29 réussis.
- ESLint après la première tranche : 0 erreur, 7 avertissements (8 avant les changements).
- `git diff --check` : réussi.
- TypeScript local : non conclu, processus arrêté par la limite mémoire du poste distant.
- Build local : non conclu, limite mémoire/temps du poste distant.
- CI GitHub du commit `863d17e8ec3717d2d295d26b5edc8d55ced84d4a` : réussi (audit dépendances, lint, tests, build).
- Compilation iOS du même commit : réussie sur le workflow macOS/simulateur.
- Captures navigateur réelles de la branche : non disponibles ; Playwright/Puppeteer et navigateur ne sont pas installés dans le poste distant.
- Validation réelle iPhone/iPad/Android/Safari : en attente.
