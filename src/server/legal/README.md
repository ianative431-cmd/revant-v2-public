# Consentement légal — état actuel et évolution prévue

## Ce qui est implémenté maintenant
Le consentement aux documents nécessitant un accord explicite (CGU,
Politique de confidentialité) est stocké dans les métadonnées du compte
Supabase Auth (`user_metadata.legal_consent`), écrit :
- à l'inscription (`options.data` de `signUp` / `signInWithOtp`) ;
- lors d'un re-consentement (`supabase.auth.updateUser()`), déclenché
  automatiquement quand la version d'un document accepté ne correspond
  plus à la version en vigueur (voir `consent.ts`).

C'est un mécanisme réel et fonctionnel dès qu'un vrai projet Supabase
est connecté — aucune donnée fictive.

## Limite actuelle et évolution prévue
Les métadonnées Supabase Auth ne constituent pas un journal d'audit
séparé et immuable : elles reflètent uniquement le dernier consentement
connu, pas l'historique complet des consentements successifs.

Une fois la base de données construite (Étape 3 et suivantes, voir
`revant_etat_reel_et_plan.md`), ce mécanisme devra être complété par une
table dédiée, par exemple `legal_consents` (utilisateur, document,
version, date, type de consentement, IP le cas échéant), append-only,
pour disposer d'un historique complet et opposable. Le code actuel
(`consent.ts`) est écrit pour que cet ajout n'oblige pas à revoir la
logique de vérification de version — seule la fonction `getLegalConsent`
devra lire depuis cette table plutôt que depuis les métadonnées.
