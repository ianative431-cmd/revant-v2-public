import { getAdminUserDirectory } from "@/server/admin/user-directory";

const ROLE_LABEL: Record<string, string> = {
  admin: "Admin",
  seller: "Vendeur",
  customer: "Client",
};

export default async function AdminUtilisateursPage() {
  const users = await getAdminUserDirectory();

  return (
    <div>
      <h1 className="text-xl font-bold mb-1">Utilisateurs</h1>
      <p className="text-sm text-black/60 mb-6">
        {users.length} compte{users.length > 1 ? "s" : ""} réel{users.length > 1 ? "s" : ""}.
      </p>

      <div className="bg-white rounded-2xl overflow-hidden">
        <div className="hidden md:grid grid-cols-[1fr_1fr_100px_140px] gap-3 px-4 py-2 text-[11px] font-semibold text-black/40 uppercase border-b border-black/5">
          <span>E-mail</span>
          <span>Téléphone</span>
          <span>Rôle</span>
          <span>Créé le</span>
        </div>
        {users.length === 0 ? (
          <p className="text-sm text-black/40 text-center py-10">Aucun utilisateur pour l&apos;instant.</p>
        ) : (
          users.map((u) => (
            <div
              key={u.id}
              className="grid grid-cols-2 md:grid-cols-[1fr_1fr_100px_140px] gap-1 md:gap-3 px-4 py-3 text-sm border-b border-black/5 last:border-0"
            >
              <span className="truncate">{u.email ?? "—"}</span>
              <span className="text-black/60">{u.phone ? `+${u.phone}` : "—"}</span>
              <span>
                <span className="text-xs bg-black/5 rounded-full px-2 py-1">
                  {ROLE_LABEL[u.role] ?? u.role}
                </span>
              </span>
              <span className="text-black/40 text-xs">
                {new Date(u.created_at).toLocaleDateString("fr-FR")}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
