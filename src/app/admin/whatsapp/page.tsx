import { requireSuperAdmin } from "@/server/auth/roles";
import { getWhatsAppStatus, getMetaClientConfig } from "@/server/admin/whatsapp";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import ConnectButton from "./ConnectButton";
import FeatureToggle from "./FeatureToggle";
import { VerifyConnectionButton, TestWebhookButton, DisconnectButton } from "./ActionButtons";

const STATUS_LABEL: Record<string, { label: string; className: string }> = {
  disconnected: { label: "Non connecté", className: "bg-black/10 text-black/60" },
  connecting: { label: "Connexion en cours", className: "bg-amber-100 text-amber-800" },
  connected: { label: "Connecté", className: "bg-green-100 text-green-800" },
  expired: { label: "Autorisation expirée", className: "bg-amber-100 text-amber-800" },
  error: { label: "Erreur de connexion", className: "bg-red-100 text-red-700" },
  unavailable: { label: "Service WhatsApp indisponible", className: "bg-red-100 text-red-700" },
};

const WEBHOOK_LABEL: Record<string, string> = {
  operational: "Opérationnel",
  error: "Erreur",
  not_configured: "Non configuré",
};

function Badge({ children, className }: { children: React.ReactNode; className: string }) {
  return (
    <span className={`inline-block text-xs font-medium px-2.5 py-1 rounded-full ${className}`}>
      {children}
    </span>
  );
}

async function getRecentWhatsAppEvents() {
  const supabase = createSupabaseAdminClient();
  const { data } = await supabase
    .from("audit_logs")
    .select("id, action, description, metadata, created_at")
    .in("entity_type", ["whatsapp_connection", "whatsapp_webhook"])
    .order("created_at", { ascending: false })
    .limit(20);
  return data ?? [];
}

export default async function AdminWhatsAppPage() {
  await requireSuperAdmin();

  const [status, events] = await Promise.all([getWhatsAppStatus(), getRecentWhatsAppEvents()]);
  const { appId, configId } = getMetaClientConfig();
  const statusInfo = STATUS_LABEL[status.status];
  const isConnected = status.status === "connected";

  const integrationItems: Array<[string, boolean]> = [
    ["Meta Business", Boolean(status.metaBusinessId)],
    ["WhatsApp Business", isConnected],
    ["Numéro professionnel", Boolean(status.phoneNumberDisplay)],
    ["Webhooks", status.webhookStatus === "operational"],
    ["Messagerie API", isConnected],
    ["Assistant IA", status.features.aiAssistantEnabled],
    ["Notifications", status.features.notificationsEnabled],
    ["Authentification WhatsApp", status.features.whatsappLoginEnabled],
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold">Meta WhatsApp Business</h1>
        <p className="text-sm text-black/50 mt-1">
          Connecter le compte Meta Business et le WhatsApp Business existant du propriétaire.
        </p>
      </div>

      {!status.metaAppConfigured && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 text-amber-900 text-sm p-3">
          Configuration serveur manquante : <code className="text-xs">META_APP_ID</code> et{" "}
          <code className="text-xs">META_APP_SECRET</code> doivent être définies pour que la connexion
          fonctionne réellement.
        </div>
      )}

      <div className="bg-white rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <p className="text-xs text-black/50 mb-1">État de la connexion</p>
            <Badge className={statusInfo.className}>{statusInfo.label}</Badge>
          </div>
          {!isConnected && status.status !== "connecting" && (
            <ConnectButton appId={appId} configId={configId} />
          )}
          {isConnected && (
            <ConnectButton appId={appId} configId={configId} label="Reconnecter Meta" />
          )}
        </div>

        {isConnected && (
          <div className="text-sm space-y-1 pt-2 border-t border-black/5">
            <p>
              <span className="text-black/50">Nom professionnel : </span>
              {status.businessName ?? "—"}
            </p>
            <p>
              <span className="text-black/50">Numéro : </span>
              {status.phoneNumberDisplay ?? "—"}
            </p>
            {status.lastVerifiedAt && (
              <p className="text-xs text-black/40">
                Dernière vérification : {new Date(status.lastVerifiedAt).toLocaleString("fr-FR")}
              </p>
            )}
          </div>
        )}

        {status.lastError && (
          <p className="text-red-600 text-xs pt-2 border-t border-black/5">{status.lastError}</p>
        )}

        {isConnected && (
          <div className="flex flex-wrap gap-2 pt-2 border-t border-black/5">
            <VerifyConnectionButton />
            <DisconnectButton />
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl p-5 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-xs text-black/50">Webhook WhatsApp</p>
          <Badge
            className={
              status.webhookStatus === "operational"
                ? "bg-green-100 text-green-800"
                : status.webhookStatus === "error"
                  ? "bg-red-100 text-red-700"
                  : "bg-black/10 text-black/60"
            }
          >
            {WEBHOOK_LABEL[status.webhookStatus]}
          </Badge>
        </div>
        {isConnected && <TestWebhookButton />}
      </div>

      <div className="bg-white rounded-2xl p-5">
        <p className="text-xs text-black/50 mb-3">État de l&apos;intégration</p>
        <div className="grid grid-cols-2 gap-x-4 gap-y-2">
          {integrationItems.map(([label, ok]) => (
            <div key={label} className="flex items-center justify-between text-sm py-1">
              <span>{label}</span>
              <span className={ok ? "text-green-700" : "text-black/30"}>{ok ? "●" : "○"}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl p-5">
        <p className="text-xs text-black/50 mb-2">Fonctionnalités (contrôle complet, à tout moment)</p>
        <FeatureToggle
          feature="whatsappLogin"
          label="Connexion WhatsApp des utilisateurs"
          initialEnabled={status.features.whatsappLoginEnabled}
        />
        <FeatureToggle
          feature="verificationCodes"
          label="Codes de vérification WhatsApp"
          initialEnabled={status.features.verificationCodesEnabled}
        />
        <FeatureToggle
          feature="notifications"
          label="Notifications WhatsApp"
          initialEnabled={status.features.notificationsEnabled}
        />
        <FeatureToggle
          feature="autoReplies"
          label="Réponses automatiques"
          initialEnabled={status.features.autoRepliesEnabled}
        />
        <FeatureToggle
          feature="aiAssistant"
          label="Assistant IA"
          initialEnabled={status.features.aiAssistantEnabled}
        />
        <FeatureToggle
          feature="humanHandoff"
          label="Transfert vers un opérateur humain"
          initialEnabled={status.features.humanHandoffEnabled}
        />
      </div>

      <div className="bg-white rounded-2xl p-5">
        <p className="text-xs text-black/50 mb-3">Journal des événements</p>
        {events.length === 0 ? (
          <p className="text-sm text-black/40">Aucun événement pour l&apos;instant.</p>
        ) : (
          <ul className="space-y-2">
            {events.map((e) => (
              <li key={e.id} className="text-xs border-b border-black/5 pb-2 last:border-0">
                <span className="text-black/40">
                  {new Date(e.created_at).toLocaleString("fr-FR")}
                </span>{" "}
                — {e.description}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
