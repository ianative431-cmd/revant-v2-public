# Préparation WhatsApp OTP — Revant

Cette intégration remplace le transport SMS de Supabase Auth par un modèle WhatsApp Business **AUTHENTICATION** approuvé. Supabase Auth reste responsable de générer, expirer et vérifier le code. L'Edge Function ne génère jamais de code et ne le stocke jamais.

## Fonctionnement

1. Revant appelle `supabase.auth.signInWithOtp({ phone })`.
2. Supabase Auth génère le code et appelle le HTTP Send SMS Hook.
3. L'Edge Function vérifie la signature Standard Webhooks avant de lire le payload.
4. Elle valide le numéro E.164 et le code, puis lit le jeton et le numéro WhatsApp déjà enregistrés par la connexion Meta Revant.
5. Elle envoie un modèle WhatsApp AUTHENTICATION via `POST /{phone_number_id}/messages`.
6. L'utilisateur saisit le code dans Revant ; `verifyPhoneOtp` continue d'utiliser Supabase Auth avec `type: "sms"`.

## Fichiers

- `supabase/functions/send-sms/index.ts` : réception sécurisée du hook et envoi Meta.
- `supabase/functions/send-sms/helpers.mjs` : validation et construction du payload.
- `tests/whatsapp-otp-payload.test.mjs` : tests Node sans secrets ni appel réseau.

## Secrets et paramètres requis (à configurer séparément)

Ne jamais placer ces valeurs dans le dépôt ou le client :

- `SEND_SMS_HOOK_SECRET` : secret HTTP Hook Supabase au format `v1,whsec_<base64>`. Plusieurs secrets peuvent être séparés par `|` pendant une rotation.
- `META_GRAPH_API_VERSION` : version Graph API encore prise en charge et validée pour le compte Meta.
- `META_WHATSAPP_OTP_TEMPLATE` : nom exact du modèle AUTHENTICATION approuvé.
- `META_WHATSAPP_OTP_LANGUAGE` : code exact de langue approuvé pour ce modèle (par ex. `fr` ou `fr_FR`, à confirmer dans Meta).

La fonction utilise `SUPABASE_URL` et les clés serveur déjà injectées par Supabase. Elle privilégie `SUPABASE_SECRET_KEYS` (clé nommée `default`) et accepte l'ancienne variable `SUPABASE_SERVICE_ROLE_KEY` en compatibilité. La nouvelle clé secrète Supabase est envoyée uniquement dans l'en-tête `apikey`, jamais comme Bearer token.

Le jeton Meta et le `phone_number_id` ne sont pas dupliqués dans les secrets Edge : ils sont lus côté serveur depuis les tables de connexion Meta déjà utilisées par l'administration Revant. La ligne `whatsapp_connection` doit avoir `id = 1`, `status = connected` et un `phone_number_id`; `whatsapp_secret` doit contenir le jeton d'accès.

## Préconditions Meta

Créer ou utiliser un modèle WhatsApp de catégorie **AUTHENTICATION**, avec un bouton OTP de type **COPY_CODE**, puis attendre son approbation. Le nom et la langue doivent correspondre exactement aux valeurs configurées. Le code doit être envoyé dans le corps et dans le paramètre du bouton de copie.

Régler la durée d'expiration du code dans Supabase Auth de façon à ce qu'elle ne dépasse pas la durée d'expiration affichée par le modèle WhatsApp.

## Activation manuelle — NON EFFECTUÉE

Après revue et tests :

1. Déployer la fonction avec la vérification JWT désactivée pour ce endpoint de hook (par exemple `supabase functions deploy send-sms --no-verify-jwt`). La vérification Standard Webhooks reste obligatoire dans le code.
2. Dans Supabase Dashboard > Authentication > Hooks, configurer le hook **Send SMS** vers l'URL HTTPS de la fonction et lui associer `SEND_SMS_HOOK_SECRET`.
3. Vérifier que l'authentification par téléphone est activée et que la confirmation automatique des numéros est désactivée ; sinon aucun OTP/hook ne sera généré.
4. Effectuer un test contrôlé avec un numéro de test autorisé, vérifier la réception WhatsApp, puis saisir le code dans Revant.
5. N'activer `whatsappLogin` qu'après validation de bout en bout.

Aucune configuration de projet Supabase, aucun secret, aucun modèle Meta, aucun compte utilisateur et aucun déploiement ne sont modifiés par ce dépôt.

## Limites et sécurité

- Le hook est un remplacement du transport SMS Supabase ; il ne fournit pas automatiquement de fallback SMS.
- Si Meta refuse le message, si la connexion Meta est absente/expirée ou si l'API dépasse le délai court, le hook renvoie une erreur et l'envoi OTP échoue. L'interface doit afficher une erreur générique et permettre une nouvelle tentative contrôlée.
- Les erreurs ne contiennent jamais le code OTP, le jeton Meta ni la réponse brute de Meta.
- Le corps du hook est limité à 20 Ko ; seules les requêtes POST avec signature Standard Webhooks valide sont acceptées.
- Aucun message WhatsApp réel n'est envoyé par les tests.
