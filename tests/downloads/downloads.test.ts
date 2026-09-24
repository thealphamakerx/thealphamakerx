import { test } from "node:test";
import assert from "node:assert/strict";

process.env.BETTER_AUTH_SECRET ??= "test-secret-for-download-tokens";
process.env.DATABASE_URL ??= "postgres://unused@localhost/unused";
// Presigning is local — fake credentials are enough, nothing reaches R2.
Object.assign(process.env, {
  R2_ACCOUNT_ID: "testaccount",
  R2_ACCESS_KEY_ID: "test-key",
  R2_SECRET_ACCESS_KEY: "test-secret",
  R2_BUCKET: "test-bucket",
});

const { authorizeDownload } = await import("../../src/lib/downloads");
const { createOrderAccessToken } = await import("../../src/lib/order-token");

const email = "buyer@example.com";
const paidOrder = { id: "order-1", userId: `guest:${email}`, email, status: "PAID" };
const product = { digitalFileKey: "products/p1/files/abc.pdf", digitalFileName: "Guide.pdf", digitalAccessUrl: null };

function lookups(overrides: { order?: object | null; item?: object | null; product?: object | null } = {}) {
  return {
    order: async (id: string) => ("order" in overrides ? overrides.order : id === paidOrder.id ? paidOrder : null) as never,
    orderItem: async (orderId: string, productId: string) =>
      ("item" in overrides ? overrides.item : orderId === "order-1" && productId === "p1" ? { id: "i1" } : null) as never,
    product: async () => ("product" in overrides ? overrides.product : product) as never,
  };
}

const token = createOrderAccessToken("order-1");

test("a paid buyer gets a 15-minute presigned R2 URL for a product in their order", async () => {
  const result = await authorizeDownload(token, "p1", lookups());
  assert.equal(result.ok, true);
  if (!result.ok) return;
  const url = new URL(result.url);
  assert.equal(url.host, "test-bucket.testaccount.r2.cloudflarestorage.com");
  assert.equal(url.searchParams.get("X-Amz-Expires"), "900");
  assert.match(url.searchParams.get("response-content-disposition") ?? "", /attachment; filename="Guide.pdf"/);
  assert.ok(!result.url.includes("test-secret"), "the secret key must never appear in the URL");
});

test("every failed check is refused without generating a URL", async () => {
  const cases: [string, Parameters<typeof authorizeDownload>, number][] = [
    ["forged token", ["order-1.forged", "p1", lookups()], 403],
    ["token for another order", [createOrderAccessToken("order-2"), "p1", lookups()], 403],
    ["order missing", [token, "p1", lookups({ order: null })], 403],
    ["order owned by another email", [token, "p1", lookups({ order: { ...paidOrder, userId: "guest:other@example.com" } })], 403],
    ["payment pending", [token, "p1", lookups({ order: { ...paidOrder, status: "PENDING" } })], 403],
    ["order refunded", [token, "p1", lookups({ order: { ...paidOrder, status: "REFUNDED" } })], 403],
    ["product not in the order", [token, "p2", lookups()], 403],
    ["no file uploaded", [token, "p1", lookups({ product: { digitalFileKey: null, digitalFileName: null, digitalAccessUrl: null } })], 404],
  ];
  for (const [name, args, status] of cases) {
    const result = await authorizeDownload(...args);
    assert.equal(result.ok, false, name);
    if (!result.ok) assert.equal(result.status, status, name);
    assert.ok(!("url" in result), `${name}: no URL may be returned`);
  }
});
