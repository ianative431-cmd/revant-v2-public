# Journal des incidents et contrôles Revant — 13 novembre 2026

## 00:54 UTC — alertes de dépendances indisponibles
- Action GitHub Dependabot `GITHUB_LIST_REPOSITORY_DEPENDABOT_ALERTS` appelée sur `ianative431-cmd/revant-v2-public` avec `state=open` et `ecosystem=npm`.
- Résultat : HTTP 403, message explicite « Dependabot alerts are disabled for this repository ».
- Répétition de vérification après la création de la PR #106 : même HTTP 403. Cela confirme une fonctionnalité de sécurité désactivée au niveau du dépôt, et non une erreur de filtre ou de pagination.
- Aucun paramètre du dépôt n'a été modifié pour tenter de contourner cette restriction. La gestion des alertes devra être activée dans les paramètres GitHub du dépôt par son propriétaire, ou remplacée par un audit npm explicite.

## 00:53 UTC — avertissement npm observé sur Render
- Pendant `npm install` du déploiement `9ed1cab`, npm a indiqué : 442 packages audités et 7 vulnérabilités de sévérité modérée.
- Le contrôle GitHub initial `npm audit --omit=dev --audit-level=high` a réussi, mais ce seuil ne suffisait pas à conclure que les dépendances de production n'avaient aucune vulnérabilité modérée.
- Une PR de diagnostic #107 a renforcé l'audit de production à `npm audit --omit=dev --audit-level=moderate`.
- Résultat confirmé : l'audit modéré de production a réussi, ainsi que l'installation, ESLint, les tests Node et le build Next.js. Les sept vulnérabilités modérées signalées par `npm install` ne sont donc pas présentes dans les dépendances de production excluant les dépendances de développement.
- La PR #107 a été fusionnée dans `main` : `494c49e1a6f1e09a47dfd6ef43f1309dab65a336`. Le seuil de sécurité renforcé est maintenant actif.
- Ne pas exécuter `npm audit fix` automatiquement : les dépendances de développement devront être identifiées et mises à jour de façon ciblée si nécessaire.

## 00:55 UTC — recherche de code GitHub incomplète
- Les recherches GitHub `GITHUB_SEARCH_CODE` sur les classes `border-brand-border`, `text-brand-muted` et `bg-brand-nav` ont renvoyé `incomplete_results=true` avec zéro résultat.
- Repli utilisé : lecture directe des fichiers connus et inspection de l'arbre du dépôt. Les tokens `brand-border` et `brand-muted` sont explicitement utilisés dans la page Paramètres, alors que leur mapping Tailwind manquait dans `@theme inline`.
- Correction limitée intégrée dans la PR #106 : mapping des deux tokens vers les variables CSS existantes ; aucune couleur de marque n'est modifiée.

## 00:56 UTC — PR et contrôle
- La PR #106 a déplacé le sélecteur de thème vers Paramètres > Apparence, amélioré les boutons Clair/Sombre et enregistré les tokens de bordure et de texte secondaire. Elle a passé installation, audit, ESLint, tests Node et build Next.js puis a été fusionnée dans `main` : `def5cb19f776ed1d0827cbcbfa2d0d85f541f67b`.
- L'appel groupé qui tentait ensuite de lire les alertes Dependabot a échoué en HTTP 403. Aucun paramètre du dépôt n'a été modifié.
- Aucun changement de données Supabase, secret, paiement, rôle ou service Admin n'a été effectué pendant ces contrôles.

## 00:51 UTC — QR code distinct de l'application
- La PR #104 a ajouté `/qr/application`, qui génère un QR PNG téléchargeable pointant vers l'URL canonique du site, et un lien d'accès dans le pied de page. Le QR de chaque boutique reste indépendant.
- Le commit `e5e3f48ad9a07faffa8a574dc3a82a176ac971e6` a été déployé sur `revant-v2-ui-premium` et Render l'a marqué `live` à 00:51:32 UTC.
- Le build Render contient la route `/qr/application`, le serveur a démarré sur `0.0.0.0:10000` et a indiqué `Ready`.
- Limite de vérification : l'ouverture web directe de `https://revant-v2-ui-premium.onrender.com/qr/application` a renvoyé une erreur interne du navigateur de vérification (« URL is not accessible via this tool »). La connexion Firecrawl n'était pas active non plus. La page est présente dans le build et le service est Live, mais aucun test HTTP externe indépendant n'est confirmé.

## 00:54 UTC — caméra du profil
- La politique `Permissions-Policy` avait `camera=()`, bloquant l'accès à la caméra pour l'origine Revant, alors que le composant profil contient déjà des entrées distinctes caméra et galerie.
- La PR #105 a remplacé ce blocage par `camera=(self)`, sans autoriser la caméra à d'autres sites et en gardant microphone, géolocalisation, paiements et USB désactivés.
- La PR #105 a passé installation, audit, ESLint, tests Node et build Next.js puis a été fusionnée dans `main` : `9ed1cab266719e720db6a316e77a2f67ecd00738`.
- Render a confirmé le déploiement `dep-dbr5us5ckfvc73da8peg` `live` à 00:54:35 UTC. Les logs confirment `next start -H 0.0.0.0 -p 10000`, le réseau `0.0.0.0:10000` et `Ready`.
- Limite : la permission est maintenant correctement configurée et déployée, mais le test final d'ouverture de caméra sur le téléphone Android de l'utilisateur reste à faire.

## 00:58–01:00 UTC — publication de l'interface Paramètres
- La PR #106 a été fusionnée et déployée sur le seul service public `revant-v2-ui-premium`, commit `def5cb19f776ed1d0827cbcbfa2d0d85f541f67b`.
- Render a confirmé le déploiement `dep-dbr61fgae00c73emkhpg` `live` à 01:00:13 UTC. Les logs confirment le démarrage sur `0.0.0.0:10000` et `Ready`.
- Le service Admin n'a pas été modifié. Aucun changement Supabase, secret, authentification ou paiement n'a été réalisé.

## 01:01 UTC — récupération des logs GitHub Actions
- Le téléchargement des logs du job `131610798706` avant la fin du job a renvoyé HTTP 404 `BlobNotFound`.
- Le suivi du job par l'API des étapes a ensuite confirmé la réussite complète de l'installation, de l'audit de production à sévérité modérée, d'ESLint, des tests Node et du build. Aucun échec du code n'a été constaté.
