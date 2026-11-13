
### QR code distinct de l’application — 13 novembre 2026
- Création d’une route publique dédiée `/qr/application` qui génère côté serveur un véritable QR PNG pointant vers l’URL canonique `env.siteUrl()` (même source de vérité que les liens de boutiques). Le QR application est distinct du QR individuel de boutique déjà présent dans `/compte/boutique`.
- La page affiche le logo officiel déjà référencé dans les métadonnées PWA, permet le téléchargement du PNG et indique explicitement que le QR boutique reste séparé. Un lien public vers cette page est ajouté au pied de page.
- Aucun lien vers un APK ou store mobile n’est inventé : le QR ouvre l’accueil officiel de Revant, en attendant une éventuelle URL de distribution native validée.
- La PR #103 a passé installation, audit dépendances, ESLint, tests Node et build Next.js, puis a été fusionnée en squash dans `main` : `db95839c05de37c52df2ead6a84bb3bbb46babc6`.
- Render a accepté une nouvelle demande de déploiement du commit `db95839` sur le service public `revant-v2-ui-premium` ; l’état initial retourné est `queued`. Le déploiement précédent du commit `59c4a1d` reste anormalement en `update_in_progress` depuis 00:30 UTC. Aucun trafic HTTP n'a été retourné par la requête de métriques sur la période contrôlée ; le site ne doit pas encore être déclaré vérifié en production.
