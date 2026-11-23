# Revant — audit boutique publique et flux de commande
Date : 22 novembre 2026
Base examinée : `main` à `68454e1156fa94fa859cd03ce4835ec2ce220af3`.

## 1. Page publique de boutique

### Routes
- `/shops/[slug]` est un alias de compatibilité qui effectue une redirection permanente vers `/shop/[slug]`.
- La page réelle est `src/app/shop/[slug]/page.tsx`.

### Fonctions déjà présentes
- Résolution côté serveur d'une boutique au statut `active` uniquement via `resolveShopBySlug`.
- Métadonnées SEO/Open Graph avec bannière ou logo si l'URL est un média public valide du bucket `shop-media`.
- Bannière : `banner_url`, puis `background_image_url` en repli.
- Logo : `logo_url`.
- Nom, description, localisation et couleur de fond validée.
- Badge Premium si `is_premium` est vrai.
- Badge « Boutique vérifiée » seulement si une certification de type `shop` possède le statut `approved`.
- Navigation ancrée vers accueil, produits et contact.
- Grille de produits provenant de `getActiveProductsForShop`, donc limitée aux produits au statut `active`.
- Contact téléphonique, WhatsApp et réseaux sociaux normalisés avant affichage.
- État vide explicite si la boutique n'a aucun produit publié.
- Les médias de boutique sont gérés dans `ShopMediaForm.tsx`, avec validation du type réel de fichier, limite 8 Mo, compression de bannière, stockage Supabase et mise à jour de la ligne propriétaire.

### Conclusion
La page publique décrite dans l'ancien audit (bannière, logo, produits avec photos, informations et navigation) est déjà implémentée dans le code actuel. La route plurielle est également prise en charge. Il ne faut pas créer une deuxième vitrine. La vérification visuelle en production reste à faire avec une boutique active réelle ; aucune capture production n'a été obtenue dans cet audit.

## 2. Fiche produit et recommandations

- La fiche produit actuelle est déjà reliée à Supabase et affiche les données réelles.
- La galerie sélectionne les photos réellement enregistrées pour le produit.
- Les stocks par taille sont actuellement affichés, mais le code de la fiche ne transmet pas de taille choisie au panier ou au flux de commande.
- La fiche ne contient pas encore de section de produits similaires ou de recommandations dans le composant examiné.
- Une recommandation doit exclure le produit courant, les produits inactifs et ceux dont le stock est nul ; ne pas créer de produits de démonstration.

## 3. Modèle de commande observé

Fichiers examinés :
- `src/app/commande/visiteur/page.tsx`
- `src/server/orders/guest-actions.ts`
- `src/server/orders/orders.ts`
- migrations `20261010211419_guest_checkout.sql`, `20261102060740_atomic_guest_checkout_and_order_transitions.sql`, `20261103194734_guest_order_quantity_2026_11_03.sql`.

Constats :
- Une commande est stockée dans `orders` et ses lignes dans `order_items`. Les lectures regroupent déjà les lignes sous chaque commande.
- Le schéma relationnel permet donc qu'une commande contienne plusieurs lignes.
- Le checkout invité visible actuellement reçoit un seul `productId` et une quantité, puis appelle `create_guest_order` pour ce produit.
- La migration de checkout invité valide l'idempotence, verrouille le produit, vérifie la disponibilité et crée une commande avec une ligne de commande.
- Le modèle de transition vendeur vérifie qu'une commande appartient à une seule boutique (`invalid_order_shop_scope` si plusieurs boutiques sont présentes).
- Le panier actuel n'a pas de checkout multi-lignes : il propose une commande séparée par article.

### Conséquence pour un futur panier multi-boutiques
Le modèle actuel suggère une évolution prudente : regrouper visuellement les articles par boutique, puis créer une commande distincte par boutique au sein d'une même expérience de checkout, si le contrat serveur et le traitement de paiement sont conçus pour cela. Ne pas introduire un ordre multi-boutiques unique sans refonte des règles vendeur, livraison, stock, annulation et paiement. Les prix, stocks, quantités, frais et remises doivent être recalculés côté serveur.

## 4. Suite de travail recommandée

1. Ajouter des recommandations réelles à la fiche produit, avec exclusion du produit courant et des produits sans stock, sans inventer de contenu.
2. Auditer le modèle exact des variantes avant de permettre leur sélection et leur transmission au checkout.
3. Concevoir le panier groupé par boutique comme une expérience multi-commandes, sans promettre un paiement consolidé tant que les paiements multi-vendeurs ne le permettent pas.
4. Vérifier la page boutique en production avec une boutique active et ses médias réels avant de conclure que l'affichage est identique au code.


## 5. Avis produit — vérification Supabase en lecture seule

Projet Supabase contrôlé : `Revant` (`xugcmpnrigqfszyfufoc`), état `ACTIVE_HEALTHY`.

- La table `public.reviews` existe et RLS est activé.
- La lecture `SELECT` est accordée à `anon` et `authenticated`.
- La politique publique ne laisse lire que les lignes `is_published = true`.
- L'insertion est réservée à `authenticated` et la politique exige l'utilisateur courant, un `order_id`, un `product_id`, une ligne correspondante dans `order_items`, et une commande au statut `delivered`.
- La table contient les colonnes `id`, `user_id`, `product_id`, `shop_id`, `order_id`, `rating`, `title`, `body`, `is_published`, `created_at`, `updated_at`.
- Il n'existe actuellement aucune colonne de réponse vendeur ni date de réponse. La réponse publique du vendeur ne peut donc pas être affichée ou enregistrée sans évolution du schéma et de ses politiques.

État réel au moment du contrôle :
- 0 avis au total ;
- 0 avis publiés ;
- 0 avis publiés liés à un produit.

La branche de travail ajoute l'affichage des avis publiés, la mention d'achat vérifié lorsque `order_id` est présent, et une pagination par lots. L'API ne renvoie ni `user_id` ni `order_id`. Aucun avis fictif n'est affiché.

La réponse vendeur reste explicitement hors périmètre tant que la migration, les règles d'autorisation et le parcours de réponse du propriétaire de boutique ne sont pas définis.


## 6. Limites restantes du parcours d'avis

- Le dépôt ne contient pas encore de formulaire côté acheteur pour créer un avis après livraison.
- La base autorise l'insertion d'avis liés à une commande livrée, mais le parcours applicatif de saisie n'a pas encore été construit.
- Le schéma ne contient pas de champ de réponse vendeur ; cette partie nécessite une migration et des règles RLS spécifiques.
- Le composant de fiche produit n'affirme donc plus qu'un formulaire est déjà disponible : il indique seulement que les avis publiés apparaîtront dans cette section.


## 7. Panier — première évolution visuelle sur la branche

- Les nouvelles entrées ajoutées depuis une carte produit enregistrent l'identifiant de boutique ; celles ajoutées depuis la fiche produit enregistrent également son nom.
- Le panier regroupe visuellement les lignes par identifiant boutique.
- Les anciens éléments de `localStorage` sans métadonnées vendeur sont conservés et affichés dans des groupes séparés « Boutique à confirmer » : aucune boutique n'est devinée.
- Les sous-totaux sont calculés par devise et explicitement qualifiés d'indicatifs.
- Les URL d'images locales sont filtrées par `safeProductImageUrl` avant affichage.
- Le parcours conserve une demande de commande par article. Aucun paiement consolidé, frais de livraison fictifs ou total final multi-boutiques n'est affiché.
- Le prix et le stock restent à revalider côté serveur au moment de chaque commande.


## 8. Détail et suivi acheteur — première implémentation

- La liste des commandes mène maintenant à une page de détail réservée au propriétaire de la commande.
- La route vérifie explicitement `order.buyer_id === user.id`, même si les politiques RLS permettent aussi aux vendeurs de lire les commandes contenant leurs articles.
- La page réutilise `getOrderById`, qui récupère la commande, ses lignes et son éventuel enregistrement de livraison.
- La chronologie n'affiche que les événements disposant d'un horodatage réellement enregistré : création, confirmation, demande de livraison, attribution, récupération, livraison et annulation.
- Le fuseau d'affichage est `Africa/Niamey`.
- Le frais de livraison nul est présenté comme « À confirmer » et non comme un frais gratuit, car le checkout invité actuel initialise le frais à zéro.
- Aucun nom ou contact de livreur n'est inventé ; aucun événement intermédiaire sans horodatage n'est simulé.
- La base ne contient pas de table d'historique `delivery_events` ; la chronologie repose donc sur les seuls horodatages existants dans `orders` et `deliveries`.


- La page de détail récupère également l'adresse enregistrée liée à `shipping_address_id`, avec filtre explicite sur `user_id` et respect de la politique RLS « users manage own addresses ». Les commandes invitées utilisent les coordonnées présentes sur la commande ou l'adresse de livraison enregistrée dans `deliveries`.


## 9. Tableau de bord vendeur et espace livreur

### Ma boutique
La page `/compte/boutique` reçoit un tableau de bord avec des indicateurs réels :
- commandes reçues dans cette boutique ;
- commandes à confirmer ;
- commandes en cours ;
- commandes livrées ;
- annonces actives ;
- annonces en attente de validation ;
- annonces actives sans stock.

Les commandes sont obtenues par `getOrdersForShop(supabase, shop.id)`, qui filtre les lignes par boutique avant de compter les commandes uniques. Cela évite de compter les achats personnels du vendeur ou les commandes d'une autre boutique. Aucun chiffre d'affaires n'est affiché, car un montant de commande ne constitue pas une recette encaissée.

### Espace livreur
Le code actuel possède déjà :
- contrôle d'un profil livreur actif ;
- listes RPC des livraisons disponibles et attribuées ;
- prise en charge atomique d'une livraison ;
- progression assignée → récupérée → en route ;
- confirmation de remise par code à 4 ou 6 chiffres ;
- alertes et Live Activity.

### Déclaration d'incident — implémentation sur la branche
- Le livreur peut déclarer un incident depuis une mission qui lui est attribuée, avec une catégorie et une description factuelle.
- Le serveur vérifie la catégorie et la longueur de la description ; le RPC vérifie à nouveau que le livreur actif est bien celui affecté à la livraison.
- Le RPC exige un motif pour le statut `failed`, contrôle les transitions et écrit le motif dans la colonne existante `deliveries.failure_reason`.
- L'acheteur et les propriétaires des boutiques concernées reçoivent une notification.
- Les espaces livreur, vendeur et acheteur peuvent afficher le motif enregistré.
- La migration `20261122150000_delivery_incident_reason.sql` remplace le RPC à deux paramètres par une version à trois paramètres et retire l'ancien point d'entrée. Elle reste dans la branche GitHub : elle n'a pas été appliquée à Supabase production.
- La table possédait déjà `failure_reason` ; aucune nouvelle colonne n'est nécessaire.



## 10. Variantes de produits — audit avant implémentation

### État réel constaté
- Les produits ont `product_type` et `size_stock` en JSONB. Pour les vêtements, `size_stock` associe un libellé de taille à une quantité.
- Il n'existe pas de table `product_variants` dans le schéma actuellement interrogé.
- `order_items` ne contient ni `variant_id` ni `variant_label`.
- La fiche produit montre les tailles et les quantités, mais elles sont uniquement informatives et ne sont pas sélectionnables.
- `AddToCartButton` identifie une ligne par le seul identifiant du produit : deux tailles d'un même article ne peuvent donc pas être représentées comme deux lignes distinctes.
- Le checkout invité accepte une quantité, mais aucun paramètre de taille.
- La confirmation vendeur réserve le stock global `products.stock_quantity`, et l'annulation le restitue. Ces fonctions ne modifient pas `size_stock`.

### Conséquence
Le stock global est protégé lors de la confirmation, mais le stock par taille n'est pas transactionnel. Afficher un sélecteur de taille sans corriger la commande et les RPC donnerait une fausse garantie de réservation.

### Conditions nécessaires avant d'activer le sélecteur
1. Définir une identité stable de variante ou, à défaut pour le modèle actuel, un `variant_label` validé côté serveur.
2. Transporter le choix dans le panier, l'idempotence et le checkout.
3. Enregistrer le choix dans chaque ligne de commande, avec un instantané lisible pour l'acheteur et le vendeur.
4. Vérifier atomiquement la disponibilité de la taille au moment de la confirmation vendeur.
5. Décrémenter simultanément `size_stock[variant_label]` et le stock global, dans une seule transaction.
6. Restituer exactement la même variante lors d'une annulation autorisée.
7. Préserver les commandes historiques sans variante et définir le comportement des anciennes versions de l'application.
8. Ajouter des tests de concurrence, d'idempotence, de quantité insuffisante, de confirmation et d'annulation.

Aucun sélecteur de taille n'a été ajouté à ce stade : l'implémentation doit être livrée avec le flux serveur complet, et non comme une simple amélioration visuelle.
