# Journal des incidents et contrôles Revant — 13 novembre 2026

## 00:54 UTC — alertes de dépendances indisponibles
- Action GitHub Dependabot `GITHUB_LIST_REPOSITORY_DEPENDABOT_ALERTS` appelée sur `ianative431-cmd/revant-v2-public` avec `state=open` et `ecosystem=npm`.
- Résultat : HTTP 403, message explicite « Dependabot alerts are disabled for this repository ».
- Répétition de vérification après la création de la PR #106 : même HTTP 403. Cela confirme une fonctionnalité de sécurité désactivée au niveau du dépôt, et non une erreur de filtre ou de pagination.
- Aucun paramètre du dépôt n'a été modifié pour tenter de contourner cette restriction. La gestion des alertes devra être activée dans les paramètres GitHub du dépôt par son propriétaire, ou remplacée par un audit npm explicite.

## 00:53 UTC — avertissement npm observé sur Render
- Pendant `npm install` du déploiement `9ed1cab`, npm a indiqué : 442 packages audités et 7 vulnérabilités de sévérité modérée.
- Le contrôle GitHub actuel `npm audit --omit=dev --audit-level=high` a réussi, mais ce seuil ne suffit pas à conclure que les dépendances de production n'ont aucune vulnérabilité modérée.
- Les paquets/advisories concernés n'ont pas encore été identifiés. Ne pas exécuter `npm audit fix` sans examiner les versions, la portée runtime/dev et les changements de compatibilité.
- Prochaine action de sécurité : lancer un audit npm détaillé incluant les sévérités modérées et identifier les paquets exacts avant toute mise à niveau.

## 00:55 UTC — recherche de code GitHub incomplète
- Les recherches GitHub `GITHUB_SEARCH_CODE` sur les classes `border-brand-border`, `text-brand-muted` et `bg-brand-nav` ont renvoyé `incomplete_results=true` avec zéro résultat.
- Repli utilisé : lecture directe des fichiers connus et inspection de l'arbre du dépôt. Les tokens `brand-border` et `brand-muted` sont explicitement utilisés dans la page Paramètres, alors que leur mapping Tailwind manquait dans `@theme inline`.
- Correction limitée préparée dans la PR #106 : mapping des deux tokens vers les variables CSS existantes ; aucune couleur de marque n'est modifiée.

## 00:56 UTC — PR et contrôle
- La création de la PR #106 a réussi (sélecteur de thème déplacé vers Paramètres uniquement), mais l'appel groupé qui tentait ensuite de lire les alertes Dependabot a échoué en HTTP 403. La PR est bien créée et son URL est https://github.com/ianative431-cmd/revant-v2-public/pull/106.
- Aucun changement de données Supabase, secret, paiement, rôle ou service Render n'a été effectué pendant ces contrôles.
