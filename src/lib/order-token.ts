import crypto from "crypto";

// Permanent, non-expiring access token for a PAID order — an HMAC over the
// orderId, so it can't be forged without BETTER_AUTH_SECRET. It grants no
// access on its own: every route that accepts one still re-checks the
// order's live status, so a token becomes worthless the moment an order is
// refunded or cancelled. Lets guest buyers (no account) reach their
// purchase via a plain URL, on-screen or emailed.
function getSecret(): string {
  const secret = process.env.BETTER_AUTH_SECRET;
  if (!secret) throw new Error("BETTER_AUTH_SECRET is not set");
  return secret;
}

export function createOrderAccessToken(orderId: string): string {
  const signature = crypto.createHmac("sha256", getSecret()).update(orderId).digest("base64url");
  return `${orderId}.${signature}`;
}

export function verifyOrderAccessToken(token: string): string | null {
  const [orderId, signature] = token.split(".");
  if (!orderId || !signature) return null;

  const expected = crypto.createHmac("sha256", getSecret()).update(orderId).digest("base64url");
  const provided = Buffer.from(signature);
  const expectedBuf = Buffer.from(expected);
  if (provided.length !== expectedBuf.length || !crypto.timingSafeEqual(provided, expectedBuf)) {
    return null;
  }

  return orderId;
}

// Permanent key to a buyer's order history — there are no customer accounts,
// so "my orders" is scoped to an email address. The key is saved on the
// buyer's device after payment and can be re-sent to their inbox; knowing an
// email alone never reveals its orders.
export function createOrdersKey(email: string): string {
  const normalized = email.trim().toLowerCase();
  const signature = crypto.createHmac("sha256", getSecret()).update(`orders:${normalized}`).digest("base64url");
  return `${Buffer.from(normalized).toString("base64url")}.${signature}`;
}

export function verifyOrdersKey(key: string): string | null {
  const [encoded, signature] = key.split(".");
  if (!encoded || !signature) return null;

  const email = Buffer.from(encoded, "base64url").toString();
  const expected = Buffer.from(createOrdersKey(email).split(".")[1]);
  const provided = Buffer.from(signature);
  if (provided.length !== expected.length || !crypto.timingSafeEqual(provided, expected)) {
    return null;
  }

  return email;
}
