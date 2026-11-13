

### Suite de mise à jour — annuaire boutiques (13 novembre 2026)
- Nouvelle tranche préparée sur une branche isolée issue du commit de production `59c4a1d5f8c90f790b2738da09f5ffed59476f20` : recherche locale des boutiques actives par nom, ville, type et description ; filtres Tout/Boutiques/Restaurants/Premium ; compteurs réels et état vide réinitialisable. Les cartes n'exposent au composant client que les champs publics nécessaires.
- Garde-fous : aucune migration Supabase, aucune modification des données, de l'authentification, des rôles, des paiements, des QR codes ou des variables Render.
- Incident de consultation : la lecture de `docs/REVANT_CHAT_VISION_AND_ROADMAP.md` sur `main` a renvoyé 404 ; le document se trouve uniquement dans la branche/PR #100 et n'est pas présent sur `main`. Aucun fichier n'a été créé artificiellement à partir de cette lecture.
- Contrôle Render : le build du commit `59c4a1d5f8c90f790b2738da09f5ffed59476f20` a terminé avec `Build successful` et Next.js a indiqué `Ready` sur l'instance le 13 novembre 2026 à 00:31 UTC. L'API de déploiement continuait toutefois à retourner `update_in_progress` ; une vérification HTTP externe reste à effectuer avant de qualifier le déploiement de confirmé.
