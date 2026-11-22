# Revant — audit technique de départ et mesures Android
Date : 22 novembre 2026

## Périmètre et prudence
Audit en lecture seule du commit de production `68454e1156fa94fa859cd03ce4835ec2ce220af3` (branche `main`), plus mesure du build Android lancé pour établir la référence. Ce document ne signifie pas que les changements de l'application sont déjà implémentés. Aucun déploiement Render n'a été lancé.

## 1. Mesure Android de référence

Workflow GitHub Actions : [run 45023532204](https://github.com/ianative431-cmd/revant-v2-public/actions/runs/45023532204)

- Résultat : `success`.
- Commit construit : `68454e1156fa94fa859cd03ce4835ec2ce220af3`.
- Revant debug APK : **6 150 594 octets** (6,15 MB décimaux, environ 5,87 MiB).
- Super Admin debug APK : **6 441 001 octets** (6,44 MB décimaux, environ 6,14 MiB).
- Les deux APK ont été extraits des artefacts GitHub et mesurés directement, pas estimés à partir de la taille des archives.
- Le workflow actuel impose un plafond de 60 000 000 octets. Ce garde-fou n'est pas une mesure de la taille et n'a pas été modifié.
- Il s'agit de builds **debug**. Les tailles release, AAB et taille installée ne sont pas encore mesurées.

## 2. Constat Android Revant

Fichiers examinés : `android-apps/revant/capacitor.config.ts`, `package.json`, `README.md`, `www/index.html` et `.github/workflows/android-apks.yml`.

- L'application Capacitor utilise l'identifiant `ne.revant.marketplace`.
- `webDir` pointe vers `www`, dont l'index local est un écran de connexion minimal de 205 octets.
- La configuration Capacitor charge ensuite le site distant Render : `https://revant-v2-ui-premium.onrender.com/?source=android-app`.
- Le paquet de 6,15 MB est donc principalement un conteneur Android/WebView et ses dépendances natives ; l'interface marketplace complète n'est pas embarquée localement.
- Les plugins Capacitor installés sont Core/Android 8.6.2, App 8.1.2 et Browser 8.0.5.
- Le flux OAuth Android documenté utilise un Custom Tab et le schéma `ne.revant.marketplace://auth/callback`.

Conséquence : l'application dépend du réseau pour afficher l'expérience marketplace. Il ne faut pas annoncer un fonctionnement complet hors ligne. La prochaine évolution doit construire un shell local utile (démarrage, état réseau, reprise, pages d'aide/état et ressources de marque) tout en conservant les opérations sensibles et les données transactionnelles vérifiées par le serveur.

## 3. Constat Android Super Admin

Fichiers examinés : `android-apps/super-admin/capacitor.config.ts`, `package.json` et `www/index.html`.

- Le projet Super Admin possède une interface HTML locale dédiée.
- Cette interface comprend un coffre local de brouillons chiffrés avec AES-GCM et une dérivation de clé PBKDF2-SHA256 (600 000 itérations).
- Le texte de l'interface précise que les brouillons restent sur l'appareil et que l'administration réelle exige une connexion Internet et l'authentification habituelle.
- Le raccourci en ligne ouvre `/admin-connexion`; il ne donne pas de privilège administratif hors ligne.
- Cette fonction de coffre local est une fonction réellement locale, mais elle ne constitue pas une administration Revant hors ligne.

## 4. Constat marketplace : fiche produit

Fichiers examinés : `src/app/produit/[id]/page.tsx`, `src/components/products/ProductGallery.tsx` et `src/components/products/AddToCartButton.tsx`.

Fonctions déjà présentes et reliées aux données :
- La fiche charge le produit via `getProductById` côté serveur et n'affiche que les produits au statut `active`.
- La boutique associée est récupérée depuis Supabase.
- Le propriétaire ne peut pas acheter sa propre annonce.
- L'état épuisé est dérivé du stock réel.
- La galerie utilise les URL d'images du produit, filtrées par `safeProductImageUrl`, avec miniatures sélectionnables.
- Le prix, la devise, la description et le format de parfum sont affichés lorsque disponibles.
- Les stocks par taille des produits vestimentaires sont affichés.
- Liens vers la boutique, signalement, contact vendeur, ajout au panier et commande visiteur existent.

Limites constatées :
- Les tailles sont présentées comme informations de stock ; aucune sélection de variante n'est transmise au panier dans ce composant.
- Aucun bloc d'avis/notes ou de recommandations n'est présent dans cette fiche.
- Le bouton d'ajout au panier stocke des lignes dans `localStorage` sous `revant-cart`, avec contrôle de forme côté navigateur seulement. Le serveur doit rester l'autorité sur prix, stock et variantes lors de la commande.

## 5. Constat marketplace : panier

Fichier examiné : `src/components/cart/CartPage.tsx`.

- Le panier est conservé dans `localStorage`.
- Les quantités sont modifiables côté client, avec une borne de 1 à 99.
- Les lignes peuvent être supprimées.
- Le composant propose une commande distincte par article.
- Un message indique explicitement que chaque article fait l'objet d'une demande distincte et que la quantité sera vérifiée côté serveur.

Limites constatées :
- Pas de regroupement visuel et transactionnel par boutique.
- Pas de sous-total global, frais de livraison consolidés, remise globale ou total multi-boutiques.
- Pas de flux de paiement unique pour un panier multi-vendeurs dans ce composant.
- Les données du navigateur ne doivent jamais servir de source fiable pour le prix, le stock, la livraison ou les remises.

## 6. Ordre d'implémentation proposé

1. Préparer une coque Android locale et robuste, sans prétendre embarquer l'application Next.js SSR complète ; documenter les écrans réellement disponibles hors ligne et les états de reconnexion.
2. Renforcer la fiche produit : sélection réelle des variantes lorsque le schéma serveur le permet, informations structurées, états de chargement/erreur et recommandations issues uniquement de produits actifs réellement disponibles.
3. Renforcer le panier en conservant une compatibilité transitoire avec `revant-cart`, puis définir le contrat serveur nécessaire avant d'activer un panier multi-boutiques et un paiement consolidé.
4. Poursuivre l'audit des pages boutique publique, commandes, suivi, vendeur, livreur, notifications et administration avant de modifier leurs flux.
5. Mesurer debug, release, AAB et taille installée séparément. Le seuil de 30 MB ne sera fixé qu'après ces mesures et une décision sur le métrique cible.

## 7. Garde-fous

- Pas de fausses boutiques, produits, commandes, avis, transactions ou statistiques.
- Pas de données sensibles ni de secrets serveur embarqués dans l'APK.
- Pas de changement de seuil CI sur la seule base de la taille des archives.
- Pas de modification de `main`, pas de merge et pas de déploiement Render dans cette phase.
- Préserver les tokens existants de `src/app/globals.css` et les fonctions déjà en production.
