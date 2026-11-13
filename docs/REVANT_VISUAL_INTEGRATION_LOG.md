# Journal d’intégration visuelle Revant — 12 novembre 2026

## Périmètre
- Palette Tangerine électrique, sans invalider les identifiants de cookies historiques.
- Carrousel d’accueil à trois visuels distincts, avec défilement automatique, transitions et indicateurs synchronisés.
- Remplacement de l’entrée « Mon Revant » par « Paramètres », avec « Mon compte » conservé dans le hub.
- Rubriques Paramètres, icônes et couleurs validées, Historique et Mes reçus.
- Préservation des parcours existants, des boutons, des onglets, des paiements et des données.

## Tentatives, incidents et contournements
- Le premier clonage GitHub depuis le répertoire racine du bac à sable a échoué car ce répertoire n’est pas accessible en écriture. Contournement : clonage réussi dans `/tmp/revant-work`.
- `npm` n’était pas préinstallé dans le bac à sable. Un CLI temporaire npm 12.2.2 a été récupéré, mais deux tentatives `npm ci` ont dépassé la limite d’exécution de 180 secondes ; l’installation locale reste incomplète. Contournement : les 11 tests Node natifs passent ; le workflow GitHub `Validate Revant` exécutera `npm ci`, l’audit, ESLint, les tests et le build sur la PR avant fusion, puis Render effectuera son propre build de production.
- Les requêtes Drive ciblant directement les sous-dossiers de bannières n’ont pas renvoyé leurs fichiers. La recherche globale n’a pas identifié de nouvelles bannières approuvées. Contournement : réutilisation de trois URL d’images déjà présentes dans la page d’accueil actuelle, sans inventer de nouveaux fichiers ni remplacer le logo officiel.
- La branche d’icônes existante (#78) est en conflit (`dirty`) et contient des modifications plus larges, notamment dans l’espace Super Admin. La PR #88 est un brouillon documentaire sur les reçus, sans interface ni PDF livré. Contournement : ajout limité des icônes Lucide prévues à la nouvelle page Paramètres et au seul élément de navigation explicitement remplacé ; aucune fusion de ces branches.
- Le premier script d’intégration a rencontré un dossier `src/components/home` absent. Contournement : création explicite des répertoires nécessaires, puis reprise de l’écriture des nouveaux composants.

## Garde-fous
- Aucune migration Supabase, aucun changement de secrets, d’authentification, de paiements, de permissions Super Admin ou de règles RLS.
- Les reçus listés réutilisent les commandes réellement livrées et les routes de reçu existantes ; ils ne sont pas présentés comme des preuves de paiement.
- Les palettes de boutiques vendeuses et l’identité Admin/Super Admin restent indépendantes.

## Suite de mise à jour — 13 novembre 2026

### Intégration et déploiement
- La PR #101 (raccourcis Revant Mega et cartes produits) a passé le workflow GitHub `Validate Revant` : installation, audit dépendances, ESLint, tests Node et build Next.js réussis. Fusion squash dans `main` : `4f4380159cc98c3e891f4be9f47ff495ba743841`.
- Le service Render public `revant-v2-ui-premium` a été déployé manuellement depuis `main` (auto-déploiement désactivé). Le déploiement `dep-dbr5ctk9v7es73epmv90` est passé à l'état `live` le 13 novembre 2026 à 00:16 UTC. Le service Admin n'a pas été modifié.

### Réintégration de la vitrine et des images
- Les PR historiques #72 et #91 reposaient sur une ancienne base. Leur contenu est réintégré dans une branche neuve issue de `main`, sans reprendre la suppression du carrousel trois slides, les couleurs anciennes en dur, ni le remplacement des commandes distinctes caméra/galerie par un seul champ.
- Les URL d'images de boutiques et produits sont limitées au bucket public approprié (`shop-media` ou `product-images`) du projet Supabase configuré, en HTTPS et à origine exacte.
- La validation des images produit contrôle la signature réelle JPEG/PNG/WebP. Les chemins de stockage produit utilisent un UUID pour éviter les collisions. La suppression d'une ancienne image de boutique est limitée au dossier de la boutique du propriétaire connecté.
- L'interface caméra et galerie reste séparée. Les pages Catégories, Produit et Restaurants reprennent la navigation partagée et restent sur les variables de thème Tangerine actuelles.

### État Supabase vérifié en lecture seule
- `storage.buckets` : `product-images` public, limite 10 485 760 octets (10 MiB), JPEG/PNG/WebP ; `shop-media` public, limite 8 388 608 octets (8 MiB), JPEG/PNG/WebP.
- La migration historique `20261103231500_configure_product_images_bucket` n'est pas présente dans les 74 migrations appliquées. Le stockage réel a déjà les limites attendues ; aucune migration n'a été rejouée ni appliquée.
- Les appels de gestion Supabase ont échoué en lecture (HTTP 403 sur l'historique Management API, HTTP 401 sur la configuration Storage). Repli : inspection réussie via la connexion MCP en lecture seule (historique et requête SELECT sur `storage.buckets`). Aucun contournement des droits, aucune écriture DB.

### Limites et validation restante
- La nouvelle branche boutique doit encore passer le workflow complet GitHub avant fusion. Aucun changement Supabase ou de variables Render n'est inclus.
- Le déploiement public doit être contrôlé par une requête HTTP et par les journaux Render après la mise en ligne.

### Suite de mise à jour — annuaire boutiques (13 novembre 2026)
- Nouvelle tranche préparée sur une branche isolée issue du commit de production `59c4a1d5f8c90f790b2738da09f5ffed59476f20` : recherche locale des boutiques actives par nom, ville, type et description ; filtres Tout/Boutiques/Restaurants/Premium ; compteurs réels et état vide réinitialisable. Les cartes n'exposent au composant client que les champs publics nécessaires.
- La PR #103 a passé installation, audit dépendances, ESLint, tests Node et build Next.js, puis a été fusionnée en squash dans `main` : `db95839c05de37c52df2ead6a84bb3bbb46babc6`.
- Garde-fous : aucune migration Supabase, aucune modification des données, de l'authentification, des rôles, des paiements, des QR codes ou des variables Render.
- Incident de consultation : la lecture de `docs/REVANT_CHAT_VISION_AND_ROADMAP.md` sur `main` a renvoyé 404 ; le document se trouve uniquement dans la branche/PR #100 et n'est pas présent sur `main`. Aucun fichier n'a été créé artificiellement à partir de cette lecture.
- Incident d'accès Supabase : l'action de lecture de l'historique des migrations a renvoyé HTTP 403 Forbidden. Aucun changement n'a été tenté en écriture et aucun droit n'a été contourné ; l'historique déjà obtenu précédemment via l'outil MCP en lecture seule reste la référence disponible.
- Incident d'outil externe : la tentative de vérification HTTP via Firecrawl n'a pas pu s'exécuter car aucune connexion Firecrawl active n'était disponible dans cette session. Aucune dépense ni modification externe n'a été effectuée.
- Correction documentaire : une première écriture sur la branche de travail n'avait inclus que le nouvel extrait. La PR #103 a restauré le journal complet avant fusion.

### Déploiement Render et liaison du port (13 novembre 2026)
- Le déploiement du commit `59c4a1d` est resté bloqué en `update_in_progress` et le scan de port a échoué (`Port scan timeout reached, no open ports detected`). Les logs montraient pourtant `next start` prêt sur le port 10000, mais sans déclaration explicite de l'interface réseau.
- L'ancien déploiement bloqué `dep-dbr5jul9fdbs73dbl7ug` a été annulé après vérification ; le déploiement plus récent était déjà en file.
- Configuration du seul service public `revant-v2-ui-premium` corrigée en conservant le build `npm install && npm run build` et en explicitant le démarrage `npm run start -- -H 0.0.0.0 -p $PORT`. Aucun secret, variable d'environnement, branche, réglage d'auto-déploiement ou service Admin n'a été modifié.
- Le déploiement du commit `db95839` `dep-dbr5raaaujis73clm460` a réussi et Render a confirmé `Your service is live` à 00:49:25 UTC. Les logs montrent `next start -H 0.0.0.0 -p 10000`, `Network: http://0.0.0.0:10000` et `Ready`.

### QR code distinct de l’application (13 novembre 2026)
- Création d’une route publique dédiée `/qr/application` qui génère côté serveur un véritable QR PNG pointant vers l’URL canonique `env.siteUrl()` (même source de vérité que les liens de boutiques). Le QR application est distinct du QR individuel de boutique déjà présent dans `/compte/boutique`.
- La page affiche le logo officiel déjà référencé dans les métadonnées PWA, permet le téléchargement du PNG et indique explicitement que le QR boutique reste séparé. Un lien public vers cette page est ajouté au pied de page.
- Aucun lien vers un APK ou store mobile n’est inventé : le QR ouvre l’accueil officiel de Revant, en attendant une éventuelle URL de distribution native validée.
- La PR #104 a passé installation, audit dépendances, ESLint, tests Node et build Next.js, puis a été fusionnée en squash dans `main` : `e5e3f48ad9a07faffa8a574dc3a82a176ac971e6`. Les sept annotations du workflow étaient des avertissements non bloquants (Node 20 des actions GitHub déprécié, quelques avertissements ESLint préexistants).
- Le déploiement du commit `e5e3f48` sur Render a été déclenché et reste à confirmer par son statut final et une requête HTTP.

### Photo de profil — diagnostic caméra (13 novembre 2026)
- Le composant `src/components/profile/AvatarUploader.tsx` contient déjà deux contrôles distincts : galerie sans attribut `capture`, et caméra avec `capture="environment"`. Le flux de recadrage, compression JPEG et stockage Supabase est présent.
- La politique `Permissions-Policy` dans `next.config.ts` imposait `camera=()`, ce qui bloque l'accès caméra depuis l'application et contredit le bouton « Prendre une photo ».
- Correction proposée : autoriser la caméra uniquement pour l'origine Revant avec `camera=(self)`, en conservant microphone, géolocalisation, paiement et USB désactivés. Aucune permission caméra n'est demandée automatiquement ; le navigateur doit toujours obtenir l'action/autorisation de l'utilisateur.
- Les recherches de code GitHub ont renvoyé des résultats incomplets/vides ; les fichiers réels ont été identifiés via l'arbre du dépôt. Une tentative de lecture de `src/server/profile/actions.ts` a renvoyé 404 car ce chemin n'existe pas ; le composant réel est `src/components/profile/AvatarUploader.tsx`.
