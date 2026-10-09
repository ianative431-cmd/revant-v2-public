"use client";

import { useMemo, useState } from "react";
import {
  LineChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Search, Download, AlertTriangle, TrendingUp, TrendingDown } from "lucide-react";
import type {
  FinanceSummary,
  WithdrawalRule,
  PaymentProvider,
  Payment,
  Payout,
} from "@/server/admin/finance";
import CommissionForm from "./CommissionForm";
import PayoutActions from "./PayoutActions";

type ShopLite = { status: string; createdAt: string };

type TimeRange = "30d" | "3m" | "1y";

const RANGE_DAYS: Record<TimeRange, number> = { "30d": 30, "3m": 90, "1y": 365 };
const RANGE_LABEL: Record<TimeRange, string> = {
  "30d": "30 derniers jours",
  "3m": "3 derniers mois",
  "1y": "12 derniers mois",
};

const PAYMENT_STATUS_LABEL: Record<string, string> = {
  pending: "En attente",
  authorized: "Autorisé",
  paid: "Payé",
  failed: "Échoué",
  cancelled: "Annulé",
  refunded: "Remboursé",
  partially_refunded: "Partiellement remboursé",
};

const PAYOUT_STATUS_LABEL: Record<string, string> = {
  pending: "En attente",
  approved: "Approuvé",
  processing: "En traitement",
  paid: "Payé",
  failed: "Échoué",
  cancelled: "Annulé",
  rejected: "Rejeté",
};

const DONUT_COLORS = ["#8B5CF6", "#3B82F6", "#EC4899", "#F59E0B", "#10B981", "#6366F1"];

function money(amount: number, currency = "XOF") {
  return `${amount.toLocaleString("fr-FR")} ${currency}`;
}

function startOfDay(d: Date) {
  const c = new Date(d);
  c.setHours(0, 0, 0, 0);
  return c;
}

function dayKey(d: Date) {
  return d.toISOString().slice(0, 10);
}

function bucketLabel(key: string, granularity: "day" | "week" | "month") {
  const d = new Date(key);
  if (granularity === "month") return d.toLocaleDateString("fr-FR", { month: "short" });
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
}

/** Badge de variation réel : n'affiche rien plutôt qu'un pourcentage inventé
 * quand la période précédente n'a aucune donnée pour se comparer. */
function ChangeBadge({ pct }: { pct: number | null }) {
  if (pct === null) return null;
  const positive = pct >= 0;
  return (
    <span
      className={`inline-flex items-center gap-0.5 text-[11px] font-medium rounded-full px-1.5 py-0.5 ${
        positive ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"
      }`}
    >
      {positive ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
      {positive ? "+" : ""}
      {pct.toFixed(0)}%
    </span>
  );
}

function StatCard({
  label,
  value,
  sub,
  pct,
}: {
  label: string;
  value: string;
  sub?: string;
  pct?: number | null;
}) {
  return (
    <div className="bg-[#16161F] rounded-2xl p-4 border border-white/5">
      <p className="text-xs text-white/50 mb-2">{label}</p>
      <p className="text-2xl font-bold text-white">{value}</p>
      <div className="flex items-center gap-1.5 mt-1.5">
        {pct !== undefined && <ChangeBadge pct={pct} />}
        {sub && <p className="text-[11px] text-white/35">{sub}</p>}
      </div>
    </div>
  );
}

function Panel({
  title,
  action,
  children,
  className = "",
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`bg-[#16161F] rounded-2xl p-4 border border-white/5 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-medium text-white">{title}</p>
        {action}
      </div>
      {children}
    </div>
  );
}

export default function FinanceDashboard({
  summary,
  rule,
  providers,
  payments,
  payouts,
  commissionPercent,
  shops,
}: {
  summary: FinanceSummary;
  rule: WithdrawalRule;
  providers: PaymentProvider[];
  payments: Payment[];
  payouts: Payout[];
  commissionPercent: number;
  shops: ShopLite[];
}) {
  const [range, setRange] = useState<TimeRange>("30d");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const computed = useMemo(() => {
    const now = new Date();
    const rangeDays = RANGE_DAYS[range];
    const rangeStart = new Date(now.getTime() - rangeDays * 86400000);
    const prevRangeStart = new Date(rangeStart.getTime() - rangeDays * 86400000);
    const today = startOfDay(now);
    const yesterday = new Date(today.getTime() - 86400000);

    const paidInRange = payments.filter(
      (p) => p.status === "paid" && p.paidAt && new Date(p.paidAt) >= rangeStart
    );
    const paidPrevRange = payments.filter(
      (p) =>
        p.status === "paid" &&
        p.paidAt &&
        new Date(p.paidAt) >= prevRangeStart &&
        new Date(p.paidAt) < rangeStart
    );

    const revenueInRange = paidInRange.reduce((s, p) => s + p.amount, 0);
    const revenuePrevRange = paidPrevRange.reduce((s, p) => s + p.amount, 0);
    const revenuePct = revenuePrevRange > 0 ? ((revenueInRange - revenuePrevRange) / revenuePrevRange) * 100 : null;

    const todayRevenue = payments
      .filter((p) => p.status === "paid" && p.paidAt && startOfDay(new Date(p.paidAt)).getTime() === today.getTime())
      .reduce((s, p) => s + p.amount, 0);
    const yesterdayRevenue = payments
      .filter((p) => p.status === "paid" && p.paidAt && startOfDay(new Date(p.paidAt)).getTime() === yesterday.getTime())
      .reduce((s, p) => s + p.amount, 0);
    const todayPct = yesterdayRevenue > 0 ? ((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100 : null;

    const activeShops = shops.filter((s) => s.status === "active").length;
    const newShopsInRange = shops.filter((s) => new Date(s.createdAt) >= rangeStart).length;
    const newShopsPrevRange = shops.filter(
      (s) => new Date(s.createdAt) >= prevRangeStart && new Date(s.createdAt) < rangeStart
    ).length;
    const newShopsPct =
      newShopsPrevRange > 0 ? ((newShopsInRange - newShopsPrevRange) / newShopsPrevRange) * 100 : null;

    // Série du graphique : jour si <=30j, semaine si <=90j, sinon mois.
    const granularity: "day" | "week" | "month" = rangeDays <= 30 ? "day" : rangeDays <= 90 ? "week" : "month";
    const buckets = new Map<string, number>();
    for (const p of paidInRange) {
      const d = new Date(p.paidAt!);
      let key: string;
      if (granularity === "day") key = dayKey(d);
      else if (granularity === "week") {
        const monday = new Date(d);
        monday.setDate(d.getDate() - ((d.getDay() + 6) % 7));
        key = dayKey(monday);
      } else {
        key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
      }
      buckets.set(key, (buckets.get(key) ?? 0) + p.amount);
    }
    const series = Array.from(buckets.entries())
      .sort(([a], [b]) => (a < b ? -1 : 1))
      .map(([key, value]) => ({ key, label: bucketLabel(key, granularity), value }));

    // Répartition par fournisseur, sur la période sélectionnée.
    const byProvider = new Map<string, { count: number; volume: number }>();
    for (const p of paidInRange) {
      const cur = byProvider.get(p.provider) ?? { count: 0, volume: 0 };
      cur.count += 1;
      cur.volume += p.amount;
      byProvider.set(p.provider, cur);
    }
    const providerBreakdown = Array.from(byProvider.entries())
      .map(([name, v]) => ({ name, ...v }))
      .sort((a, b) => b.volume - a.volume);

    return {
      revenueInRange,
      revenuePct,
      todayRevenue,
      todayPct,
      activeShops,
      newShopsInRange,
      newShopsPct,
      series,
      providerBreakdown,
    };
  }, [payments, shops, range]);

  const filteredPayments = useMemo(() => {
    return payments
      .filter((p) => statusFilter === "all" || p.status === statusFilter)
      .filter((p) => {
        if (!search.trim()) return true;
        const q = search.toLowerCase();
        return (
          p.id.toLowerCase().includes(q) ||
          p.orderId.toLowerCase().includes(q) ||
          p.provider.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
      .slice(0, 50);
  }, [payments, search, statusFilter]);

  function exportCsv() {
    const header = "ID,Commande,Fournisseur,Montant,Devise,Statut,Date\n";
    const rows = filteredPayments
      .map((p) =>
        [p.id, p.orderId, p.provider, p.amount, p.currency, p.status, p.createdAt].join(",")
      )
      .join("\n");
    const blob = new Blob([header + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `revant-paiements-${dayKey(new Date())}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const totalProviderVolume = computed.providerBreakdown.reduce((s, p) => s + p.volume, 0);
  const needsAttentionCount = summary.pendingPayouts + summary.openDisputes;

  return (
    <div className="-mx-4 -mt-6 md:-mx-8 md:-mt-8 bg-[#0B0B10] min-h-screen px-4 py-6 md:px-8 md:py-8">
      {/* Barre du haut */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-white">Finance</h1>
          <p className="text-xs text-white/40 mt-0.5">Chiffres réels, à l&apos;instant — aucune donnée simulée.</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher un paiement..."
              className="bg-[#16161F] border border-white/10 rounded-full pl-8 pr-3 py-2 text-xs text-white placeholder:text-white/30 w-48 focus:outline-none focus:border-white/30"
            />
          </div>
          <button
            onClick={exportCsv}
            className="flex items-center gap-1.5 text-xs font-medium text-white/80 border border-white/15 rounded-full px-3 py-2 hover:bg-white/5"
          >
            <Download size={13} /> Exporter
          </button>
        </div>
      </div>

      {/* Sélecteur de période */}
      <div className="flex items-center gap-1 mb-4 bg-[#16161F] border border-white/5 rounded-full p-1 w-fit">
        {(["30d", "3m", "1y"] as TimeRange[]).map((r) => (
          <button
            key={r}
            onClick={() => setRange(r)}
            className={`text-xs font-medium rounded-full px-3 py-1.5 ${
              range === r ? "bg-white text-[#0B0B10]" : "text-white/50 hover:text-white"
            }`}
          >
            {r === "30d" ? "30 jours" : r === "3m" ? "3 mois" : "1 an"}
          </button>
        ))}
      </div>

      {/* 4 cartes statistiques réelles */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <StatCard
          label="Revenu du jour"
          value={money(computed.todayRevenue)}
          pct={computed.todayPct}
          sub="vs hier"
        />
        <StatCard
          label="Boutiques actives"
          value={String(computed.activeShops)}
          sub={`${computed.newShopsInRange} nouvelles · ${RANGE_LABEL[range]}`}
        />
        <StatCard
          label="Nouvelles boutiques"
          value={String(computed.newShopsInRange)}
          pct={computed.newShopsPct}
          sub={RANGE_LABEL[range]}
        />
        <StatCard
          label="À traiter"
          value={String(needsAttentionCount)}
          sub={`${summary.pendingPayouts} retraits · ${summary.openDisputes} litiges`}
        />
      </div>

      {/* Graphique revenu + répartition fournisseurs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 mb-4">
        <Panel title="Flux de revenu" className="lg:col-span-2">
          <p className="text-2xl font-bold text-white mb-1">
            {money(computed.revenueInRange)}
            <ChangeBadge pct={computed.revenuePct} />
          </p>
          <p className="text-[11px] text-white/35 mb-3">{RANGE_LABEL[range]}</p>
          {computed.series.length === 0 ? (
            <p className="text-xs text-white/30 py-16 text-center">Aucun paiement réglé sur cette période.</p>
          ) : (
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={computed.series}>
                  <XAxis
                    dataKey="label"
                    stroke="transparent"
                    tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                    minTickGap={20}
                  />
                  <YAxis hide />
                  <Tooltip
                    formatter={(v) => money(typeof v === "number" ? v : Number(v))}
                    contentStyle={{
                      background: "#0B0B10",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: 10,
                      fontSize: 12,
                      color: "white",
                    }}
                    labelStyle={{ color: "rgba(255,255,255,0.5)" }}
                  />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="#8B5CF6"
                    strokeWidth={2.5}
                    dot={false}
                    activeDot={{ r: 4, fill: "#8B5CF6" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </Panel>

        <Panel title="Paiements par fournisseur">
          {computed.providerBreakdown.length === 0 ? (
            <p className="text-xs text-white/30 py-16 text-center">Aucune donnée sur cette période.</p>
          ) : (
            <>
              <div className="h-32 relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={computed.providerBreakdown}
                      dataKey="volume"
                      nameKey="name"
                      innerRadius={42}
                      outerRadius={60}
                      paddingAngle={2}
                      strokeWidth={0}
                    >
                      {computed.providerBreakdown.map((_, i) => (
                        <Cell key={i} fill={DONUT_COLORS[i % DONUT_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v) => money(typeof v === "number" ? v : Number(v))} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <p className="text-sm font-bold text-white">{money(totalProviderVolume)}</p>
                  <p className="text-[10px] text-white/35">Total</p>
                </div>
              </div>
              <div className="flex flex-col gap-1.5 mt-3">
                {computed.providerBreakdown.map((p, i) => (
                  <div key={p.name} className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5 text-white/70">
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: DONUT_COLORS[i % DONUT_COLORS.length] }}
                      />
                      {p.name}
                    </span>
                    <span className="text-white/40">{p.count}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </Panel>
      </div>

      {/* Tableau des paiements récents */}
      <Panel
        title="Paiements récents"
        className="mb-4"
        action={
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-[#0B0B10] border border-white/10 rounded-full text-[11px] text-white/70 px-2.5 py-1 focus:outline-none"
          >
            <option value="all">Tous statuts</option>
            {Object.entries(PAYMENT_STATUS_LABEL).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        }
      >
        {filteredPayments.length === 0 ? (
          <p className="text-xs text-white/30 py-10 text-center">Aucun paiement ne correspond.</p>
        ) : (
          <div className="overflow-x-auto -mx-1">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-white/35 text-left">
                  <th className="font-medium px-1 py-2">Commande</th>
                  <th className="font-medium px-1 py-2">Fournisseur</th>
                  <th className="font-medium px-1 py-2">Montant</th>
                  <th className="font-medium px-1 py-2">Statut</th>
                  <th className="font-medium px-1 py-2">Date</th>
                </tr>
              </thead>
              <tbody>
                {filteredPayments.map((p) => (
                  <tr key={p.id} className="border-t border-white/5">
                    <td className="px-1 py-2.5 text-white/80 truncate max-w-32">{p.orderId}</td>
                    <td className="px-1 py-2.5 text-white/60">{p.provider}</td>
                    <td className="px-1 py-2.5 text-white font-medium">{money(p.amount, p.currency)}</td>
                    <td className="px-1 py-2.5">
                      <span className="rounded-full px-2 py-0.5 bg-white/5 text-white/60 text-[10px]">
                        {PAYMENT_STATUS_LABEL[p.status] ?? p.status}
                      </span>
                    </td>
                    <td className="px-1 py-2.5 text-white/40">
                      {new Date(p.createdAt).toLocaleDateString("fr-FR")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      {/* Alerte réelle : retraits en attente + litiges ouverts */}
      {needsAttentionCount > 0 && (
        <Panel title="" className="mb-4 flex items-center gap-3 !p-4" action={undefined}>
          <AlertTriangle size={18} className="text-amber-400 shrink-0" />
          <div className="flex-1 -mt-3">
            <p className="text-sm text-white font-medium">
              {summary.pendingPayouts} retrait{summary.pendingPayouts > 1 ? "s" : ""} et {summary.openDisputes} litige
              {summary.openDisputes > 1 ? "s" : ""} en attente
            </p>
            <p className="text-[11px] text-white/35">Voir les sections ci-dessous pour traiter.</p>
          </div>
        </Panel>
      )}

      {/* Commission, règle de retrait, fournisseurs — fonctionnalités existantes conservées */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
        <Panel title="Commission Revant">
          <CommissionForm initialValue={commissionPercent} />
        </Panel>

        {rule && (
          <Panel title="Règle de retrait (XOF)">
            <dl className="grid grid-cols-2 gap-y-2 text-xs">
              <dt className="text-white/40">Minimum</dt>
              <dd className="text-right text-white/80">{money(rule.minAmount)}</dd>
              <dt className="text-white/40">Maximum</dt>
              <dd className="text-right text-white/80">{rule.maxAmount ? money(rule.maxAmount) : "—"}</dd>
              <dt className="text-white/40">Plafond quotidien</dt>
              <dd className="text-right text-white/80">{rule.dailyLimit ? money(rule.dailyLimit) : "—"}</dd>
              <dt className="text-white/40">Frais</dt>
              <dd className="text-right text-white/80">
                {money(rule.feeAmount)} + {rule.feePercent}%
              </dd>
              <dt className="text-white/40">KYC requis</dt>
              <dd className="text-right text-white/80">{rule.kycRequired ? "Oui" : "Non"}</dd>
              <dt className="text-white/40">Validation manuelle</dt>
              <dd className="text-right text-white/80">{rule.manualApprovalRequired ? "Oui" : "Non"}</dd>
              <dt className="text-white/40">Règle active</dt>
              <dd className="text-right text-white/80">{rule.enabled ? "Oui" : "Non"}</dd>
            </dl>
          </Panel>
        )}
      </div>

      <Panel title="Fournisseurs de paiement" className="mb-4">
        {providers.length === 0 ? (
          <p className="text-xs text-white/30">Aucun fournisseur configuré.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {providers.map((p) => (
              <div key={p.code} className="flex items-center justify-between text-xs">
                <span className="text-white/70">{p.name}</span>
                <span className={p.enabled ? "text-emerald-400 font-medium" : "text-white/30"}>
                  {p.enabled ? "Actif" : "Inactif"}
                </span>
              </div>
            ))}
          </div>
        )}
      </Panel>

      <Panel title="Retraits vendeurs">
        {payouts.length === 0 ? (
          <p className="text-xs text-white/30 py-6 text-center">Aucun retrait pour l&apos;instant.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {payouts.map((p) => (
              <div
                key={p.id}
                className="bg-[#0B0B10] border border-white/5 rounded-xl p-3 flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <p className="text-xs font-medium text-white">{money(p.amount, p.currency)}</p>
                  <p className="text-[11px] text-white/35 mt-0.5">
                    {new Date(p.requestedAt).toLocaleDateString("fr-FR")}
                    {p.failureReason ? ` · ${p.failureReason}` : ""}
                  </p>
                </div>
                {p.status === "pending" ? (
                  <PayoutActions payoutId={p.id} />
                ) : (
                  <span className="text-[11px] shrink-0 rounded-full px-2 py-1 bg-white/5 text-white/50">
                    {PAYOUT_STATUS_LABEL[p.status] ?? p.status}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </Panel>
    </div>
  );
}
