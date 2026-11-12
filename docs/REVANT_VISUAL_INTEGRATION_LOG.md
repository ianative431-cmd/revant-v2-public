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
