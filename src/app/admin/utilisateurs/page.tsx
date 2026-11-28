import { getAdminUserDirectory } from "@/server/admin/user-directory";
import { getCurrentUserRoles, hasPermission, requirePermission } from "@/server/auth/roles";
import { setAssociateRoleAction } from "@/server/admin/associate-actions";

const ROLE_LABEL: Record<string, string> = {
  admin: "Admin",
  seller: "Vendeur",
  customer: "Client",
  buyer: "Client",
  associate: "Associé — accès limité",
  super_admin: "Super administrateur",
  moderator: "Modérateur",
  finance_admin: "Administrateur finance",
  support_admin: "Support",
  kyc_admin: "Administrateur KYC",
  catalog_admin: "Administrateur catalogue",
};

function maskEmail(email: string | null): string {
  if (!email) return "—";
  const [local, domain] = email.split("@");
  if (!domain) return "••••••";
  return `${local.slice(0, 1)}•••@${domain}`;
}

function normalizePhone(phone: string): string {
  return phone.startsWith("+") ? phone : `+${phone}`;
}

function maskPhone(phone: string | null): string {
  if (!phone) return "—";
  const digits = normalizePhone(phone).replace(/\D/g, "");
  if (digits.length <= 4) return "••••";
  return `+${"•".repeat(Math.min(8, digits.length - 4))}${digits.slice(-4)}`;
}

export default async function AdminUtilisateursPage() {
  await requirePermission("users.view");
  const [users, currentRoles, canViewContacts] = await Promise.all([
    getAdminUserDirectory(),
    getCurrentUserRoles(),
    hasPermission("users.manage"),
  ]);
  const canManageAssociate = currentRoles.includes("super_admin");

  return (
    <div>
      <h1 className="text-xl font-bold mb-1">Utilisateurs</h1>
      <p className="text-sm text-black/60 mb-2">
        ${users.length} compte${users.length > 1 ? "s" : ""} réel${users.length > 1 ? "s" : ""}.
      </p>
      {canManageAssociate && <p className="text-xs text-black/50 mb-6">Le rôle associé donne uniquement accès à la consultation des boutiques et produits. Aucun accès aux finances, paiements, retraits, KYC ou paramètres.</p>}
      {!canManageAssociate && <div className="mb-6" />}

      <div className="bg-white rounded-2xl overflow-hidden">
        <div className="hidden md:grid md:grid-cols-[1fr_1fr_180px_140px_180px] gap-3 px-4 py-2 text-[11px] font-semibold text-black/40 uppercase border-b border-black/5">
          <span>E-mail</span>
          <span>Téléphone</span>
          <span>Rôles</span>
          <span>Créé le</span>
          <span>Accès associé</span>
        </div>
        {users.length === 0 ? (
          <p className="text-sm text-black/40 text-center py-10">Aucun utilisateur pour l&apos;instant.</p>
        ) : (
          users.map((user) => (
            <div
              key={user.id}
              className="grid grid-cols-2 md:grid-cols-[1fr_1fr_180px_140px_180px] gap-1 md:gap-3 px-4 py-3 text-sm border-b border-black/5 last:border-0"
            >
              <span className="truncate">{canViewContacts ? user.email ?? "—" : maskEmail(user.email)}</span>
              <span className="text-black/60">{canViewContacts ? (user.phone ? normalizePhone(user.phone) : "—") : maskPhone(user.phone)}</span>
              <span>
                <span className="flex flex-wrap gap-1">{user.roles.length ? user.roles.map((role) => <span key={role} className="text-xs bg-black/5 rounded-full px-2 py-1">{ROLE_LABEL[role] ?? role}</span>) : <span className="text-xs text-black/40">Client</span>}</span>
              </span>
              <span className="text-black/40 text-xs">
                {new Date(user.created_at).toLocaleDateString("fr-FR")}
              </span>
              <span className="col-span-2 md:col-span-1">{canManageAssociate ? <form action={setAssociateRoleAction}><input type="hidden" name="userId" value={user.id} /><input type="hidden" name="enabled" value={user.roles.includes("associate") ? "false" : "true"} /><button className="rounded-full border border-black/15 px-3 py-2 text-xs font-medium">{user.roles.includes("associate") ? "Retirer l’accès" : "Donner l’accès"}</button></form> : <span className="text-xs text-black/35">—</span>}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
