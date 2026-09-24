/**
 * Point d'accès unique aux variables d'environnement.
 *
 * But : échouer tôt et clairement si une variable requise manque, sans
 * jamais afficher ni journaliser sa valeur. Toute nouvelle variable
 * ajoutée au projet doit être déclarée ici ET dans .env.example.
 */

function required(name: string): string {
  const value = process.env[name];
  if (!value || value.length === 0) {
    throw new Error(
      `Variable d'environnement manquante : ${name}. Voir .env.example.`
    );
  }
  return value;
}

export const env = {
  // Publiques (visibles côté navigateur — jamais de secret ici)
  supabaseUrl: () => required("NEXT_PUBLIC_SUPABASE_URL"),
  supabaseAnonKey: () => required("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
  siteUrl: () => required("NEXT_PUBLIC_SITE_URL"),

  // Privées (serveur uniquement — ne jamais préfixer par NEXT_PUBLIC_)
  supabaseServiceRoleKey: () => required("SUPABASE_SERVICE_ROLE_KEY"),

  // Réservées aux étapes futures (non utilisées tant que les modules
  // correspondants ne sont pas construits) :
  // TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_VERIFY_SERVICE_SID
  // (paiement/payout : à définir une fois le prestataire confirmé)
};
