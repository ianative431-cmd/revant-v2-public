# Revant — projet de développement réel

Socle technique du site Revant (marketplace de vente/revente entre particuliers, Niamey/Niger). Ce dépôt remplace progressivement le prototype de démonstration `revant_app.html`, qui reste conservé à titre de référence visuelle.

Voir `ARCHITECTURE.md` pour l'organisation du projet et `SECURITY.md` pour les règles de sécurité obligatoires. Le plan de développement complet (étapes, phases) est dans `revant_etat_reel_et_plan.md`.

## Démarrage (développement local)

```bash
npm install
cp .env.example .env.local   # puis remplir les valeurs réelles, jamais commitées
npm run dev
```

## Statut actuel
Socle uniquement (Étape 0 / Phase 0). Aucune fonctionnalité métier (auth, annonces, paiements, ledger) n'est encore implémentée.
