# Revant Android — audit du mode hors connexion existant
Date : 22 novembre 2026
Base examinée : `main` à `68454e1156fa94fa859cd03ce4835ec2ce220af3`.

## 1. Fonctionnalités PWA déjà présentes

Fichiers examinés :
- `public/sw.js`
- `public/offline.html`
- `src/components/pwa/ServiceWorkerRegister.tsx`
- `public/manifest.webmanifest`
- `android-apps/revant/capacitor.config.ts`

Le site Revant dispose déjà d'une base hors connexion :
- Le service worker `/sw.js` est enregistré avec un scope racine.
- Il précache la page `/offline.html`, le logo d'application et la vidéo de lancement.
- En cas d'échec réseau lors d'une navigation publique, il renvoie la page hors connexion.
- Les routes `/admin`, `/api`, `/compte`, `/connexion` et `/inscription` ne sont pas mises en cache par la règle de navigation.
- Le catalogue public peut mémoriser jusqu'à 12 produits réels, avec nom, prix, devise, stock indicatif, catégorie et image.
- Les images sont limitées à 1,5 MB chacune et doivent provenir du bucket public `product-images` sur l'origine Supabase autorisée.
- Le catalogue hors connexion affiche un avertissement : prix et stock peuvent avoir changé et doivent être reconfirmés à la reconnexion.
- Le manifeste PWA définit Revant comme application installable en mode autonome.

## 2. Différence avec le paquet Android

La configuration Capacitor charge actuellement le site distant Render via `server.url`. Le fichier `android-apps/revant/www/index.html` n'est qu'une page locale minimale.

Les données et ressources mises en cache par le service worker sont stockées dans les données du WebView après utilisation. Elles ne sont pas ajoutées à la taille du fichier APK. Il faut donc distinguer :
- taille de l'APK distribué ;
- taille installée de l'application ;
- données/cache WebView créés après utilisation ;
- catalogue et images disponibles hors connexion.

## 3. Conséquences

- Ne pas réécrire une deuxième page hors connexion : `public/offline.html` existe déjà.
- Ne pas ajouter de produits, images ou vidéos de remplissage pour atteindre 30 MB.
- La prochaine étape Android est un test réel sur WebView/Capacitor : première ouverture en ligne, installation du service worker, mise en cache du catalogue, fermeture forcée, passage hors ligne, redémarrage, affichage de la page hors connexion, puis reconnexion.
- Vérifier la persistance du cache sur Android/Samsung et le comportement après mise à jour de l'application.
- Les données transactionnelles, les comptes, les commandes, l'administration et les opérations financières doivent rester indisponibles hors ligne tant qu'elles n'ont pas de mécanisme local sûr et de synchronisation serveur conçue.

## 4. Décision de taille

La référence mesurée reste :
- Revant debug APK : 6 150 594 octets.
- Super Admin debug APK : 6 441 001 octets.

La cible de 30 MB est traitée comme un plafond de taille APK, pas comme un minimum à atteindre. Les caches PWA ne doivent pas être confondus avec la taille du paquet. Mesurer séparément debug, release, AAB, taille installée et données/cache sur appareil.
