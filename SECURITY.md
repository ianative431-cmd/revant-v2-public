# Règles de sécurité — Revant

Ce document s'applique à tout code écrit dans ce projet, à toutes les étapes futures. Il reprend et complète l'audit de sécurité réalisé en amont (`revant_audit_securite.md`, `revant_etat_reel_et_plan.md` — Partie 5).

## Principe général
Toute validation faite côté frontend doit être dupliquée côté serveur. Le frontend n'est jamais considéré comme une protection suffisante, quelle que soit la simplicité apparente du champ concerné.

## Règles obligatoires

1. **Injections SQL/NoSQL** — Toujours passer par le client Supabase (requêtes paramétrées). Jamais de SQL dynamique construit à partir d'une entrée utilisateur, y compris dans une future fonction RPC.
2. **XSS** — Échapper tout contenu généré par un utilisateur avant affichage. Ne jamais injecter de HTML brut non filtré provenant d'un utilisateur.
3. **CSRF** — Cookies de session `SameSite=Lax` ou `Strict` (géré par `@supabase/ssr`). Toute action sensible future (retrait, suppression de compte) devra exiger une revalidation explicite.
4. **Authentification et sessions** — Uniquement via Supabase Auth. Ne jamais implémenter de système de mot de passe ou de hachage personnalisé.
5. **Rôles et permissions** — Toute vérification de rôle (acheteur/vendeur/admin) se fait côté serveur, via RLS Supabase ou un helper serveur (`src/server/auth/`). Jamais via une donnée transmise par le client ou déduite d'une URL. Un test d'accès direct à une ressource ou route non autorisée doit systématiquement échouer.
6. **Rate limiting et force brute** — À prévoir sur toute route future de connexion, réinitialisation, création de compte ou d'annonce, et sur les futures routes financières.
7. **Fichiers uploadés** — Vérification du type réel (pas seulement l'extension), taille limitée, nom de fichier généré aléatoirement, jamais le nom d'origine. Les documents KYC futurs iront dans un bucket privé séparé, accessible uniquement par URL signée temporaire.
8. **Secrets** — Jamais en dur dans le code, jamais commités. Toute variable nouvelle est déclarée dans `.env.example` sans valeur, et documentée dans `src/lib/env.ts`. La clé service role Supabase ne doit jamais porter le préfixe `NEXT_PUBLIC_` et ne doit jamais être importée dans un fichier accessible au navigateur (`admin.ts` utilise `import "server-only"` pour le garantir au build).
9. **En-têtes HTTP de sécurité** — CSP, HSTS, `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy` — à configurer dans `next.config.ts` avant la mise en production.
10. **CORS** — Restreindre aux domaines officiels de Revant dès que des routes API seront exposées publiquement.
11. **Cookies** — `Secure`, `HttpOnly`, `SameSite` adapté — déjà géré nativement par `@supabase/ssr` pour les cookies de session.
12. **Erreurs serveur** — Ne jamais renvoyer au client une stack trace, une requête SQL, un mot de passe ou un token. Messages génériques côté client, détails uniquement dans les logs serveur.
13. **Routes admin** — Vérification de rôle côté serveur à chaque requête, jamais par simple masquage dans l'interface.
14. **Paiements (futur)** — Idempotence stricte, vérification systématique de la signature des webhooks, validation serveur des montants et des statuts, aucune donnée de carte stockée par Revant.
15. **Dépendances** — `npm audit` à exécuter avant chaque mise en production ; ce socle a été installé avec 0 vulnérabilité connue au moment de sa création.
16. **Logs** — Jamais de mot de passe, token, numéro de carte ou document KYC dans un log, quel qu'il soit.

## Ce qui n'est pas encore implémenté (volontairement)
Paiements, payouts, KYC réel, remboursements, litiges, ledger financier. Ces modules ne doivent être construits qu'après validation explicite, étape par étape, en suivant `revant_etat_reel_et_plan.md`.
