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
