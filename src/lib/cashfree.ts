import { createHmac, timingSafeEqual } from "node:crypto";
import { z } from "zod";

const id = z.union([z.string(), z.number()]).transform(String);
export const cashfreeOrderSchema = z.object({
  order_id: z.string(), order_amount: z.number(), order_currency: z.string(),
  order_status: z.string(), payment_session_id: z.string().optional(),
});
export const cashfreePaymentSchema = z.object({
  cf_payment_id: id, order_id: z.string(), payment_status: z.string(),
  payment_amount: z.number(), payment_currency: z.string(),
  order_amount: z.number(), order_currency: z.string(),
  payment_time: z.string(), payment_message: z.string().nullish(),
  is_captured: z.boolean().optional(),
});
export const cashfreeRefundSchema = z.object({
  refund_id: z.string().optional(), cf_payment_id: id.nullish(), refund_type: z.string().optional(), order_id: z.string(), cf_refund_id: id.nullish(),
  refund_amount: z.number(), refund_currency: z.string(), refund_status: z.string(),
  status_description: z.string().nullish(),
}).refine((refund) => !!(refund.refund_id || refund.cf_refund_id), "Refund identifier missing").transform((refund) => ({ ...refund, refund_id: refund.refund_id || `auto_${refund.cf_refund_id}` }));
export type CashfreeOrder = z.infer<typeof cashfreeOrderSchema>;
export type CashfreePayment = z.infer<typeof cashfreePaymentSchema>;
export type CashfreeRefund = z.infer<typeof cashfreeRefundSchema>;

export class CashfreeError extends Error {
  constructor(public status: number, public code: string) { super(`Cashfree ${status}: ${code}`); }
}

export function cashfreeEnvironment(): "sandbox" | "production" {
  const env = process.env.CASHFREE_ENV ?? "sandbox";
  if (env !== "sandbox" && env !== "production") throw new Error("Invalid CASHFREE_ENV");
  return env;
}

export function cashfreeConfigured() {
  return !!(process.env.CASHFREE_APP_ID && process.env.CASHFREE_SECRET_KEY);
}

export function paymentOrigin(kind: "return" | "webhook") {
  const value = kind === "return" ? process.env.CASHFREE_RETURN_ORIGIN : process.env.CASHFREE_WEBHOOK_ORIGIN;
  if (!value) throw new Error(`Cashfree ${kind} origin is not configured`);
  const url = new URL(value);
  const local = ["localhost", "127.0.0.1"].includes(url.hostname);
  if (url.username || url.password || (url.protocol !== "https:" && !(kind === "return" && local && cashfreeEnvironment() === "sandbox"))) {
    throw new Error("Cashfree requires a public HTTPS origin");
  }
  return url.origin;
}

export async function cashfreeRequest<T>(path: string, schema: z.ZodType<T>, body?: unknown, idempotencyKey?: string): Promise<T> {
  if (!cashfreeConfigured()) throw new CashfreeError(503, "not_configured");
  const base = cashfreeEnvironment() === "production" ? "https://api.cashfree.com/pg" : "https://sandbox.cashfree.com/pg";
  const response = await fetch(`${base}${path}`, {
    method: body === undefined ? "GET" : "POST", cache: "no-store",
    headers: {
      "Content-Type": "application/json", "x-client-id": process.env.CASHFREE_APP_ID!,
      "x-client-secret": process.env.CASHFREE_SECRET_KEY!,
      "x-api-version": process.env.CASHFREE_API_VERSION || "2025-01-01",
      ...(idempotencyKey ? { "x-idempotency-key": idempotencyKey } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: AbortSignal.timeout(12_000),
  });
  const data = await response.json();
  if (!response.ok) throw new CashfreeError(response.status, typeof data?.code === "string" ? data.code : "request_failed");
  return schema.parse(data);
}

export function verifyCashfreeSignature(raw: string, timestamp: string, signature: string, secret = process.env.CASHFREE_SECRET_KEY) {
  if (!secret || !/^\d+$/.test(timestamp) || !signature) return false;
  const expected = createHmac("sha256", secret).update(timestamp + raw).digest("base64");
  const actual = Buffer.from(signature);
  return actual.length === expected.length && timingSafeEqual(actual, Buffer.from(expected));
}

export async function fetchCashfreeSnapshot(orderId: string) {
  const path = `/orders/${encodeURIComponent(orderId)}`;
  const [order, payments, refunds] = await Promise.all([
    cashfreeRequest(path, cashfreeOrderSchema),
    cashfreeRequest(`${path}/payments`, z.array(cashfreePaymentSchema)),
    cashfreeRequest(`${path}/refunds`, z.array(cashfreeRefundSchema)),
  ]);
  return { order, payments, refunds };
}
