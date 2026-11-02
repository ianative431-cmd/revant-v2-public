# Audit des actifs du logo Revant

Date de contrôle : 2 novembre 2026
Dépôt contrôlé : `ianative431-cmd/revant-v2-public`, branche `main` et branche d'intégration.

## Actif actuellement présent

- Fichier : `public/images/logo-revant.svg`
- SVG carré, viewBox `0 0 1024 1024`.
- Fond actuel : `#151c18`.
- Symbole actuel : tracé géométrique en `#efe4d7`, présenté comme le logo Revant.
- Le fichier est actuellement utilisé par l'en-tête, le pied de page, les métadonnées de l'application et le manifeste PWA.

## Références confirmées

| Emplacement | Utilisation |
|---|---|
| `src/components/layout/SiteHeader.tsx` | Logo de navigation du site |
| `src/components/layout/Footer.tsx` | Logo du pied de page |
| `src/app/layout.tsx` | Icône, raccourci et icône Apple |
| `public/manifest.webmanifest` | Icônes PWA 192×192, 512×512 et maskable |
| `src/app/admin-connexion/page.tsx` | Lettre « R » rendue en texte, et non l'image SVG |

Le manifeste et les métadonnées pointent vers le même fichier `/images/logo-revant.svg`. Aucun second logo de production n'a été identifié dans le dossier `public` lors de ce contrôle.

## Comparaison avec l'original demandé

Le dossier de suivi Revant mentionne les fichiers d'origine `revant_logo.svg` et `revant_logo.png`, ainsi que la consigne « R central sur fond vert ». Les deux fichiers d'origine n'ont pas été retrouvés dans les sources actuellement accessibles :
- recherche dans le Google Drive connecté, y compris le dossier de suivi 20202 : aucun fichier portant ces noms ;
- recherche des fichiers image du Drive : seul un screenshot Alibaba sans rapport avec le logo a été retourné ;
- ancien dépôt `ianative431-cmd/revant` : il ne contient que la maquette HTML `revant_interface_mockup.html`, aucun fichier logo autonome dans sa racine.

Le fichier actuel semble reprendre un R sur fond vert très sombre, mais **il n'a pas été possible de confirmer qu'il s'agit du fichier original fourni par le propriétaire**.

## Décision

Aucun remplacement, redessin ou changement de couleur n'a été effectué. Cette décision respecte l'exigence de ne remplacer le logo qu'après comparaison visuelle avec le fichier original du propriétaire.

Pour clôturer ce point, il faut récupérer le fichier original `revant_logo.svg` ou `revant_logo.png` depuis la source du propriétaire, puis comparer les proportions, le tracé du R, le fond et les couleurs. Une fois l'original confirmé, mettre à jour ensemble l'actif, les références du site, les métadonnées, les icônes PWA et la lettre de l'écran super-admin.
