# Correction de sécurité Next.js — 21 novembre 2026

## Constat initial
Le workflow « Validate Revant » échouait sur `npm audit --omit=dev --audit-level=moderate` avec Next.js 16.4.4. Le rapport npm listait des avis de sécurité modérés publiés le 3 novembre 2026.

Avis identifiés :
- GHSA-mfr8-8qww-v76h
- GHSA-vc7v-qv4w-wrv8
- GHSA-7qx7-33qx-rqx2
- GHSA-f3mh-rxg3-f5g2
- GHSA-pc58-hwjq-p385
- GHSA-rhh4-g77r-r9qj
- GHSA-vvgp-ww4w-46vf

## Correction préparée
- `next` : 16.4.4 → 16.4.6
- `eslint-config-next` : 16.4.4 → 16.4.6
- `@next/env`, `@next/eslint-plugin-next` et les paquets binaires `@next/swc-*` : 16.4.4 → 16.4.6 dans le lockfile.
- Aucun changement aux routes, au schéma Supabase, aux secrets, à Render ou aux données de production.

## Contrôle effectué
Le workflow temporaire de régénération a restauré le lockfile de `main`, a régénéré les dépendances depuis le manifeste corrigé et a terminé avec succès. La commande `npm audit --omit=dev --audit-level=moderate` a réussi avant l'enregistrement du lockfile.

## Validation restante
Le workflow standard doit maintenant exécuter `npm ci`, ESLint, les tests et le build sur le commit contenant le lockfile complet. La PR ne doit pas être fusionnée avant cette validation.
