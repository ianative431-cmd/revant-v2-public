type Props = {
  searchParams: Promise<{ flow?: string; reason?: string }>;
};

export default async function AuthErrorPage({ searchParams }: Props) {
  const { flow, reason } = await searchParams;
  const isAdmin = flow === "admin";
  const destination = isAdmin ? "/admin-connexion" : "/connexion";
  const message = reason === "not_admin"
    ? "Ce compte Google n'est pas autorisé à ouvrir l'espace super-administrateur."
    : "La connexion Google n'a pas abouti. Vérifie que Google est activé dans Supabase et que l'adresse de retour est autorisée.";

  return (
    <main className={isAdmin ? "min-h-screen bg-[#0B0B10] px-5 py-10 text-white flex items-center justify-center" : "min-h-screen bg-brand-bg px-5 py-10 flex items-center justify-center"}>
      <section className={isAdmin ? "w-full max-w-md rounded-3xl border border-white/10 bg-white/[0.04] p-7" : "w-full max-w-md rounded-3xl bg-white p-7 shadow-sm"}>
        <h1 className="text-xl font-semibold">Connexion Google impossible</h1>
        <p role="alert" className={isAdmin ? "mt-3 text-sm text-white/70" : "mt-3 text-sm text-black/65"}>{message}</p>
        <a href={destination} className={isAdmin ? "mt-6 inline-flex rounded-full bg-white px-5 py-3 text-sm font-semibold text-black" : "mt-6 inline-flex rounded-full bg-brand-accent px-5 py-3 text-sm font-semibold text-white"}>Réessayer</a>
      </section>
    </main>
  );
}
