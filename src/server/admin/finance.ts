import "server-only";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type FinanceSummary = {
  paidPayments: number;
  paidVolume: number;
  pendingPayouts: number;
  pendingPayoutAmount: number;
  commissionVolume: number;
  openDisputes: number;
};

export type WithdrawalRule = {
  minAmount: number;
  maxAmount: number | null;
  dailyLimit: number | null;
  feeAmount: number;
  feePercent: number;
  kycRequired: boolean;
  manualApprovalRequired: boolean;
  enabled: boolean;
} | null;

export type PaymentProvider = {
  code: string;
  name: string;
  enabled: boolean;
  supportedCurrencies: string[];
};

export type Payment = {
  id: string;
  orderId: string;
  amount: number;
  currency: string;
  status: string;
  provider: string;
  providerReference: string | null;
  createdAt: string;
  paidAt: string | null;
};

export type Payout = {
  id: string;
  sellerId: string;
  amount: number;
  currency: string;
  status: string;
  provider: string | null;
  destinationType: string | null;
  destinationReference: string | null;
  requestedAt: string;
  failureReason: string | null;
};

export type AdminFinanceSnapshot = {
  summary: FinanceSummary;
  rule: WithdrawalRule;
  providers: PaymentProvider[];
  payments: Payment[];
  payouts: Payout[];
};

type SnapshotShape = {
  summary: {
    paid_payments: number;
    paid_volume: number;
    pending_payouts: number;
    pending_payout_amount: number;
    commission_volume: number;
    open_disputes: number;
  };
  rule: {
    min_amount: number;
    max_amount: number | null;
    daily_limit: number | null;
    fee_amount: number;
    fee_percent: number;
    kyc_required: boolean;
    manual_approval_required: boolean;
    enabled: boolean;
  } | Record<string, never>;
  providers: Array<{
    code: string;
    name: string;
    enabled: boolean;
    supported_currencies: string[];
  }>;
  payments: Array<{
    id: string;
    order_id: string;
    amount: number;
    currency: string;
    status: string;
    provider: string;
    provider_reference: string | null;
    created_at: string;
    paid_at: string | null;
  }>;
  payouts: Array<{
    id: string;
    seller_id: string;
    amount: number;
    currency: string;
    status: string;
    provider: string | null;
    destination_type: string | null;
    destination_reference: string | null;
    requested_at: string;
    failure_reason: string | null;
  }>;
};

/**
 * Vue d'ensemble finance réelle. Délègue entièrement au RPC
 * admin_finance_snapshot (SECURITY DEFINER), qui vérifie lui-même côté
 * base que l'appelant a un rôle admin avant de renvoyer quoi que ce
 * soit. Aucune donnée simulée : si l'appel échoue, l'erreur remonte.
 */
export async function getAdminFinanceSnapshot(): Promise<AdminFinanceSnapshot> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("admin_finance_snapshot");

  if (error) {
    throw new Error(`Impossible de charger les données finance : ${error.message}`);
  }

  const snapshot = data as unknown as SnapshotShape;
  const rule = "min_amount" in snapshot.rule ? snapshot.rule : null;

  return {
    summary: {
      paidPayments: snapshot.summary.paid_payments,
      paidVolume: snapshot.summary.paid_volume,
      pendingPayouts: snapshot.summary.pending_payouts,
      pendingPayoutAmount: snapshot.summary.pending_payout_amount,
      commissionVolume: snapshot.summary.commission_volume,
      openDisputes: snapshot.summary.open_disputes,
    },
    rule: rule
      ? {
          minAmount: rule.min_amount,
          maxAmount: rule.max_amount,
          dailyLimit: rule.daily_limit,
          feeAmount: rule.fee_amount,
          feePercent: rule.fee_percent,
          kycRequired: rule.kyc_required,
          manualApprovalRequired: rule.manual_approval_required,
          enabled: rule.enabled,
        }
      : null,
    providers: (snapshot.providers ?? []).map((p) => ({
      code: p.code,
      name: p.name,
      enabled: p.enabled,
      supportedCurrencies: p.supported_currencies,
    })),
    payments: (snapshot.payments ?? []).map((p) => ({
      id: p.id,
      orderId: p.order_id,
      amount: p.amount,
      currency: p.currency,
      status: p.status,
      provider: p.provider,
      providerReference: p.provider_reference,
      createdAt: p.created_at,
      paidAt: p.paid_at,
    })),
    payouts: (snapshot.payouts ?? []).map((p) => ({
      id: p.id,
      sellerId: p.seller_id,
      amount: p.amount,
      currency: p.currency,
      status: p.status,
      provider: p.provider,
      destinationType: p.destination_type,
      destinationReference: p.destination_reference,
      requestedAt: p.requested_at,
      failureReason: p.failure_reason,
    })),
  };
}

/** Commission Revant actuelle (system_settings), affichée dans l'éditeur. */
export async function getCommissionPercent(): Promise<number> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("system_settings")
    .select("value")
    .eq("key", "revant.commission_percent")
    .single();

  if (error || typeof data.value !== "number") {
    throw new Error("Impossible de charger la commission.");
  }

  return data.value;
}
