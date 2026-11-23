# Revant Android — objectif de taille et contenu réellement utile

## Interprétation retenue

L'objectif de 30 MB concerne le poids du paquet Android installable (APK), et non la mémoire RAM, le stockage des données utilisateur ou la taille de l'application web sur Render. À confirmer si l'utilisateur entendait une autre mesure.

## Principe

30 MB est un objectif de taille de livraison, pas un minimum à remplir artificiellement. Ne jamais ajouter de fichiers aléatoires, de vidéos décoratives, de doublons d'images, de bibliothèques inutilisées ou de données fictives pour atteindre un chiffre. Si l'APK fonctionnel et sécurisé est inférieur à 30 MB, conserver sa taille réelle.

Mesurer séparément :
- APK debug (diagnostic, non destiné à une distribution publique).
- APK release signé (livraison directe Android).
- AAB release (distribution Play Store, taille téléchargée dépendant de l'appareil).
- Taille installée sur l'appareil après installation.
- Données et cache téléchargés à l'usage, distincts du binaire.

Toujours afficher les unités en octets et MB décimaux (1 MB = 1 000 000 octets), et éventuellement MiB (1 MiB = 1 048 576 octets) pour éviter les comparaisons trompeuses.

## État vérifié dans le dépôt au 22 novembre 2026

- Projet Android Revant : `android-apps/revant`.
- Capacitor 8.6.2, App 8.1.2, Browser 8.0.5.
- Identifiant : `ne.revant.marketplace`.
- `capacitor.config.ts` pointe encore vers le site Render en distant : `https://revant-v2-ui-premium.onrender.com/?source=android-app`.
- `www` est donc un shell/placeholder et l'expérience principale dépend du réseau et du serveur distant. Le paquet actuel est un wrapper, pas une application marketplace complète autonome.
- Le workflow `.github/workflows/android-apks.yml` produit des APK debug pour Revant et Super Admin, avec une limite CI actuelle de 60 MB. Ce seuil est une limite de garde-fou, pas la taille mesurée des APK.
- Build de référence debug exécuté le 22 novembre 2026 sur `main`, commit `68454e1156fa94fa859cd03ce4835ec2ce220af3`, workflow GitHub Actions run `45023532204`.
- Revant debug APK : `6 150 594` octets, soit `6,15 MB` (environ `5,87 MiB`).
- Super Admin debug APK : `6 441 001` octets, soit `6,44 MB` (environ `6,14 MiB`).
- Ces tailles sont les tailles des APK mesurées dans les logs de build, et non les tailles ZIP compressées des artefacts.
- Le workflow mesure uniquement `assembleDebug` à ce stade. Aucun APK release signé ni AAB release n'a encore été mesuré.
- La limite CI actuelle reste `60 000 000` octets ; elle n'a pas été abaissée.

## Objectif proposé

- Cible de conception : APK Revant release ≤ 30 MB, si cela est réalisable sans sacrifier les fonctions, la sécurité, la qualité et la compatibilité.
- Ne pas imposer un plancher de 30 MB.
- Garder une marge CI sous le plafond (par exemple 29 MB) après avoir mesuré les APK debug et release et compris leurs différences; ne pas fixer le seuil CI à l'aveugle.
- Si le bundle natif réellement utile dépasse 30 MB, analyser le contenu et justifier chaque dépendance/asset avant d'envisager toute réduction ou exception.
- Le poids d'un APK debug ne prédit pas exactement celui d'un APK release optimisé; le résultat de release doit être mesuré séparément avec la configuration de signature de production.

## Comment ajouter du poids utile — uniquement si justifié

1. Embarquer un véritable shell mobile local et les ressources nécessaires au démarrage hors ligne, plutôt que l'écran placeholder.
2. Ajouter uniquement les écrans et ressources qui peuvent réellement fonctionner localement, avec des états hors ligne explicites.
3. Prévoir une mise en cache contrôlée des ressources publiques autorisées (logo, icônes, polices réellement utilisées, catégories et catalogue public approuvé), avec budgets et règles d'expiration.
4. Optimiser les images (WebP/AVIF si compatible, tailles responsives, variantes, compression) et ne pas intégrer le catalogue complet ou des photos produits en masse dans l'APK.
5. N'inclure que les plugins natifs réellement utilisés; vérifier leur compatibilité et leur sécurité.
6. Séparer les fonctions en ligne des capacités locales. Les commandes, paiements, remboursements, retraits, rôles et opérations sensibles restent confirmés par le serveur.
7. Ne jamais embarquer de secrets Supabase, clés privées, jetons, données personnelles, commandes privées ou dossiers financiers dans l'APK.

## Architecture et limites actuelles

Le projet principal est Next.js avec SSR, Server Actions et sessions Supabase. Un simple export statique ne rendrait pas automatiquement ces fonctions disponibles hors ligne. Ne pas changer `output`, retirer le serveur ou transformer le site en app statique sans une cartographie route par route et un plan d'architecture validé.

Le shell mobile peut être rendu local et autonome progressivement, mais les fonctionnalités dépendantes du serveur doivent afficher clairement :
- hors ligne ;
- connexion au serveur impossible ;
- action enregistrée localement (uniquement si cette capacité existe réellement) ;
- action envoyée/en attente ;
- confirmation serveur reçue.

Ne jamais afficher une commande, un paiement ou une synchronisation comme réussis avant confirmation serveur.

## Mesures et validation obligatoires

Avant et après chaque évolution :
- taille exacte de l'APK en octets, MB et MiB ;
- taille du AAB et estimation de téléchargement si généré ;
- taille installée sur un appareil Android réel ;
- liste des plus gros fichiers de l'APK (APK Analyzer / unzip listing) ;
- nombre de bibliothèques natives et ABIs incluses ;
- démarrage à froid, lancement hors ligne et reprise réseau ;
- tests sur Android et WebView/Chrome, notamment Samsung ;
- contrôle des permissions et des composants natifs ;
- comparaison des builds pour détecter les ajouts de poids injustifiés.

## Garde-fous de livraison

- Ne pas modifier le service Render ni déployer dans le cadre d'une mesure de taille.
- Ne pas modifier les migrations Supabase, secrets, paiements, rôles ou permissions pour faire grossir le paquet.
- Ne pas changer le seuil CI de 60 MB tant que le build de référence n'a pas fourni les poids réels et que la cible release n'a pas été mesurée.
- La mise en production ou la distribution d'un APK/AAB exige une validation explicite distincte.
