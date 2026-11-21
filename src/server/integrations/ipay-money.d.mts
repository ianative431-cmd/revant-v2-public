export type IpayMoneyEnvironment = "sandbox" | "live";
export type IpayMoneyConfig = {
  environment: IpayMoneyEnvironment;
  secretKey: string;
};
export type IpayMoneyOptions = {
  config?: IpayMoneyConfig;
  env?: NodeJS.ProcessEnv;
  fetchImpl?: typeof fetch;
};
export type IpayMobilePaymentInput = {
  amount: number;
  country?: "NE";
  currency?: "XOF";
  msisdn: string;
  transactionId: string;
  customerName: string;
};
export type IpayHostedPaymentInput = {
  amount: number;
  title: string;
  description: string;
  successUrl: string;
  failureUrl: string;
};
export class IpayMoneyError extends Error {
  status: number;
  code: string;
}
export function getIpayMoneyConfig(env?: NodeJS.ProcessEnv): IpayMoneyConfig;
export function createIpayMobilePayment(
  input: IpayMobilePaymentInput,
  options?: IpayMoneyOptions
): Promise<Record<string, unknown>>;
export function createIpayHostedPaymentLink(
  input: IpayHostedPaymentInput,
  options?: IpayMoneyOptions
): Promise<{ page_url: string; reference?: string; status?: string; [key: string]: unknown }>;
export function getIpayMobilePaymentStatus(
  reference: string,
  options?: IpayMoneyOptions
): Promise<Record<string, unknown>>;
export function getIpayHostedPaymentStatus(
  reference: string,
  options?: Pick<IpayMoneyOptions, "fetchImpl">
): Promise<Record<string, unknown>>;
export function verifyIpayWebhookSecret(receivedHeader: string | null, expectedSecret: string | null | undefined): boolean;
export function normalizeIpayPaymentStatus(status: string): "pending" | "paid" | "failed" | "refunded" | "cancelled";
