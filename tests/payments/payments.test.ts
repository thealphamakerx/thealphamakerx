import { test } from "node:test";
import assert from "node:assert/strict";
import { createHmac, randomUUID } from "node:crypto";
import { readFileSync, readdirSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import type { PoolClient } from "pg";
import { applyPaymentSnapshot } from "../../src/lib/payments/store";
import { paymentState, validateSnapshot, paise, type PaymentSnapshot } from "../../src/lib/payments/state";
import { verifyCashfreeSignature, cashfreeRequest, cashfreeOrderSchema, CashfreeError } from "../../src/lib/cashfree";
import { canAccessOrder, createCheckoutToken } from "../../src/lib/payments/access";

const orderId = "local-order";
const gatewayId = "cf_local-order";
const payment = (status = "SUCCESS", id = "payment-1", time = "2026-09-22T10:00:00Z") => ({
  cf_payment_id: id, order_id: gatewayId, payment_status: status, payment_amount: 199,
  payment_currency: "INR", order_amount: 199, order_currency: "INR", payment_time: time,
});
const snapshot = (payments = [payment()]): PaymentSnapshot => ({
  order: { order_id: gatewayId, order_status: payments.some((p) => p.payment_status === "SUCCESS") ? "PAID" : "ACTIVE", order_amount: 199, order_currency: "INR" }, payments, refunds: [],
});

test("webhook signature uses exact raw bytes and rejects forged or missing values", () => {
  const raw = '{"amount":199.00}'; const timestamp = "1790064000000"; const secret = "test-only-secret";
  const signature = createHmac("sha256", secret).update(timestamp + raw).digest("base64");
  assert.equal(verifyCashfreeSignature(raw, timestamp, signature, secret), true);
  assert.equal(verifyCashfreeSignature(JSON.stringify(JSON.parse(raw)), timestamp, signature, secret), false);
  assert.equal(verifyCashfreeSignature(raw, timestamp, "forged", secret), false);
  assert.equal(verifyCashfreeSignature(raw, "", signature, secret), false);
  assert.equal(verifyCashfreeSignature(raw, timestamp, signature, "wrong"), false);
});

test("guest order requires a scoped checkout token; other users cannot access it", () => {
  process.env.BETTER_AUTH_SECRET = "test-only-auth-secret";
  const guest = { id: orderId, userId: "guest:buyer@example.com" };
  assert.equal(canAccessOrder(guest), false);
  assert.equal(canAccessOrder(guest, undefined, createCheckoutToken(orderId)), true);
  assert.equal(canAccessOrder(guest, undefined, createCheckoutToken("other-order")), false);
  assert.equal(canAccessOrder({ id: orderId, userId: "owner" }, "stranger", createCheckoutToken(orderId)), false);
  assert.equal(canAccessOrder({ id: orderId, userId: "owner" }, "owner"), true);
});

test("amount, currency, capture and order identity must match before fulfillment", () => {
  const local = { cashfreeOrderId: gatewayId, total: 19900 };
  for (const change of [{ payment_amount: 1 }, { payment_currency: "USD" }, { order_id: "other" }, { is_captured: false }, { payment_time: "invalid" }]) {
    assert.throws(() => validateSnapshot(snapshot([{ ...payment(), ...change }]), local));
  }
  assert.throws(() => paise(-1));
  assert.throws(() => paise(1.001));
  assert.equal(paise(199.99), 19999);
});

test("no payment attempt and browser interruption do not become payment success or order failure", () => {
  assert.equal(paymentState("ACTIVE", [], [], 19900).paymentStatus, "ACTIVE");
  assert.equal(paymentState("PAID", [], [], 19900).paymentStatus, "PENDING");
  assert.equal(paymentState("ACTIVE", [{ status: "USER_DROPPED" }], [], 19900).paymentStatus, "USER_DROPPED");
  assert.equal(paymentState("EXPIRED", [], [], 19900).paymentStatus, "EXPIRED");
});

async function database() {
  const db = new PGlite();
  // Every migration, in order — the same schema production runs.
  const root = new URL("../../migrations/app/", import.meta.url);
  for (const dir of readdirSync(root).filter((d) => /^\d/.test(d)).sort()) {
    for (const op of JSON.parse(readFileSync(new URL(`${dir}/ops.json`, root), "utf8"))) {
      for (const statement of op.execute) await db.query(statement.sql, statement.params);
    }
  }
  await db.query(`INSERT INTO public."order" (id,"userId",email,status,subtotal,total,"cashfreeOrderId","paymentEnvironment","updatedAt")
    VALUES ($1,'guest:buyer@example.com','buyer@example.com','PENDING',19900,19900,$2,'sandbox',now())`, [orderId, gatewayId]);
  return db;
}
async function emailKinds(db: PGlite) {
  return (await db.query<{ kind: string }>('SELECT kind FROM "paymentEmail" ORDER BY kind')).rows.map((r) => r.kind);
}
async function apply(db: PGlite, state: PaymentSnapshot, id = randomUUID()) {
  return db.transaction(async (tx) => applyPaymentSnapshot(tx as unknown as Pick<PoolClient, "query">, orderId, state, { id, type: "TEST", source: "test" }));
}

test("actual migration and transactional flow: failure -> retry success -> duplicate -> old failure -> refund", async () => {
  const db = await database();
  try {
    let order = await apply(db, snapshot([payment("FAILED")]));
    assert.equal(order.status, "PENDING"); assert.equal(order.paymentStatus, "FAILED");
    // A failed attempt queues one delayed "payment failed" nudge (skipped at send time if they then pay).
    assert.deepEqual(await emailKinds(db), ["PAYMENT_FAILED"]);
    assert.equal((await db.query(`SELECT 1 FROM "paymentEmail" WHERE "sendAfter" > now()`)).rows.length, 1);
    const success = snapshot([payment("FAILED"), payment("SUCCESS", "payment-2", "2026-09-22T11:00:00Z")]);
    const eventId = randomUUID();
    order = await apply(db, success, eventId);
    assert.equal(order.status, "PAID"); assert.equal(order.cashfreePaymentId, "payment-2");
    await apply(db, success, eventId);
    // One receipt and one admin alert, even though the success was applied twice.
    assert.deepEqual(await emailKinds(db), ["ADMIN_NEW_SALE", "PAID", "PAYMENT_FAILED"]);
    assert.equal((await db.query('SELECT * FROM "paymentAttempt"')).rows.length, 2);
    order = await apply(db, snapshot([payment("FAILED")]));
    assert.equal(order.status, "PAID"); assert.equal(order.paymentStatus, "SUCCESS");
    success.refunds = [{ refund_id: "refund-1", order_id: gatewayId, refund_amount: 199, refund_currency: "INR", refund_status: "PENDING" }];
    order = await apply(db, success);
    assert.equal(order.status, "PAID"); assert.equal(order.paymentStatus, "REFUND_PENDING");
    success.refunds[0].refund_status = "SUCCESS";
    order = await apply(db, success);
    assert.equal(order.status, "REFUNDED"); assert.equal(order.refundedAmount, 19900);
    assert.deepEqual(await emailKinds(db), ["ADMIN_NEW_SALE", "PAID", "PAYMENT_FAILED", "REFUNDED"]);
    success.refunds[0].refund_status = "PENDING";
    order = await apply(db, success);
    assert.equal(order.status, "REFUNDED"); assert.equal(order.refundedAmount, 19900);
  } finally { await db.close(); }
});

test("invalid snapshot rolls back receipt and fulfillment; a later valid retry succeeds", async () => {
  const db = await database();
  try {
    const eventId = randomUUID();
    await assert.rejects(apply(db, snapshot([{ ...payment(), payment_amount: 2 }]), eventId));
    assert.equal((await db.query('SELECT * FROM "paymentEvent"')).rows.length, 0);
    assert.equal((await db.query('SELECT * FROM "paymentEmail"')).rows.length, 0);
    assert.equal((await apply(db, snapshot(), eventId)).status, "PAID");
  } finally { await db.close(); }
});

test("successful payment is never downgraded by a delayed pending event", async () => {
  const db = await database();
  try {
    await apply(db, snapshot());
    const order = await apply(db, snapshot([payment("PENDING")]));
    assert.equal(order.status, "PAID"); assert.equal(order.paymentStatus, "SUCCESS");
  } finally { await db.close(); }
});

test("partial refunds retain access and multiple charges are flagged", async () => {
  const db = await database();
  try {
    const partial = snapshot();
    partial.refunds = [{ refund_id: "partial", order_id: gatewayId, refund_amount: 50, refund_currency: "INR", refund_status: "SUCCESS" }];
    let order = await apply(db, partial);
    assert.equal(order.status, "PAID"); assert.equal(order.paymentStatus, "PARTIALLY_REFUNDED");
    order = await apply(db, snapshot([payment(), payment("SUCCESS", "second-charge")]));
    assert.equal(order.paymentStatus, "REVIEW_REQUIRED");
  } finally { await db.close(); }
});

test("gateway client keeps credentials server-side, uses rupees and reuses idempotency key", async (t) => {
  process.env.CASHFREE_APP_ID = "test-app"; process.env.CASHFREE_SECRET_KEY = "test-secret"; process.env.CASHFREE_ENV = "sandbox";
  const key = randomUUID();
  t.mock.method(globalThis, "fetch", async (url: string, init: RequestInit) => {
    assert.equal(url, "https://sandbox.cashfree.com/pg/orders");
    assert.equal((init.headers as Record<string, string>)["x-idempotency-key"], key);
    assert.equal(JSON.parse(init.body as string).order_amount, 199);
    assert.equal(init.cache, "no-store");
    return Response.json(snapshot().order);
  });
  await cashfreeRequest("/orders", cashfreeOrderSchema, { order_amount: 199 }, key);
});

test("gateway errors stay errors and never fabricate success", async (t) => {
  t.mock.method(globalThis, "fetch", async () => Response.json({ code: "request_failed" }, { status: 503 }));
  await assert.rejects(cashfreeRequest("/orders/x", cashfreeOrderSchema), CashfreeError);
});

test("auto-refund of an unrelated failed attempt never revokes a successful purchase", async () => {
  const db = await database();
  try {
    const state = snapshot([payment(), payment("FAILED", "failed-2")]);
    state.refunds = [{ refund_id: "auto-refund-2", cf_payment_id: "failed-2", refund_type: "PAYMENT_AUTO_REFUND", order_id: gatewayId, refund_amount: 199, refund_currency: "INR", refund_status: "SUCCESS" }];
    const order = await apply(db, state);
    assert.equal(order.status, "PAID"); assert.equal(order.refundedAmount, 0);
    assert.equal((await db.query('SELECT * FROM "paymentRefund"')).rows.length, 1);
  } finally { await db.close(); }
});

test("refund awaiting approval stays pending until confirmed", async () => {
  const db = await database();
  try {
    const state = snapshot();
    state.refunds = [{ refund_id: "refund-approval", order_id: gatewayId, refund_amount: 199, refund_currency: "INR", refund_status: "PENDING_APPROVAL" }];
    assert.equal((await apply(db, state)).paymentStatus, "REFUND_PENDING");
    state.refunds[0].refund_status = "SUCCESS";
    assert.equal((await apply(db, state)).status, "REFUNDED");
  } finally { await db.close(); }
});

test("a late success after cancellation is flagged for review without granting access", async () => {
  const db = await database();
  try {
    await db.query('UPDATE "order" SET status=\'CANCELLED\' WHERE id=$1', [orderId]);
    const order = await apply(db, snapshot());
    assert.equal(order.status, "CANCELLED"); assert.equal(order.paymentStatus, "REVIEW_REQUIRED");
    assert.equal((await db.query('SELECT * FROM "paymentEmail"')).rows.length, 0);
  } finally { await db.close(); }
});
