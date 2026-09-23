import { test } from "node:test";
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";

process.env.BETTER_AUTH_SECRET ??= "test-secret-for-email-tokens";

const { renderEmail, templateFor, DEFAULT_EMAIL_SETTINGS, SAMPLE_VARS } = await import("../../src/lib/email-templates");
const { verifyResendWebhook, unsubscribeToken, verifyUnsubscribeToken } = await import("../../src/lib/emails");

const brand = {
  name: "The Alpha Maker X", siteUrl: "https://example.com", logoUrl: "https://example.com/logo.png",
  legalName: "The Alpha Maker X", address: "Kochi, India", contactEmail: "help@example.com",
};

test("templates fill placeholders, escape content and include an unsubscribe link only on reminders", () => {
  const vars = { ...SAMPLE_VARS, items: [{ name: "Guide <script>alert(1)</script>", price: "₹999" }] };
  const reminder = renderEmail("REMINDER_1", templateFor(DEFAULT_EMAIL_SETTINGS, "REMINDER_1"), { ...vars, unsubscribeUrl: "https://example.com/u" }, brand);
  assert.match(reminder.subject, /Guide <script>/); // subject is plain text, sent as-is
  assert.ok(!reminder.html.includes("<script>alert"), "HTML body must escape product names");
  assert.ok(reminder.html.includes("&lt;script&gt;"));
  assert.ok(reminder.html.includes("https://example.com/u"));
  assert.ok(reminder.text.includes("Unsubscribe from reminders"));

  const receipt = renderEmail("PAID", templateFor(DEFAULT_EMAIL_SETTINGS, "PAID"), SAMPLE_VARS, brand);
  assert.ok(!receipt.html.includes("Unsubscribe"));
  assert.match(receipt.subject, /#A1B2C3D4/);
});

test("admin overrides replace defaults; empty overrides fall back", () => {
  const settings = { ...DEFAULT_EMAIL_SETTINGS, templates: { PAID: { subject: "Thanks for {{product}}!", heading: "  ", enabled: false } } };
  const t = templateFor(settings, "PAID");
  assert.equal(t.enabled, false);
  assert.equal(t.subject, "Thanks for {{product}}!");
  assert.equal(t.heading, "Your purchase is confirmed");
  assert.equal(renderEmail("PAID", t, SAMPLE_VARS, brand).subject, "Thanks for The Confidence Code!");
});

test("Resend (Svix) webhook signatures are verified and tampering is rejected", () => {
  const key = Buffer.from("resend-webhook-test-key");
  process.env.RESEND_WEBHOOK_SECRET = `whsec_${key.toString("base64")}`;
  const body = JSON.stringify({ type: "email.delivered", data: { email_id: "abc" } });
  const id = "msg_1";
  const timestamp = String(Math.floor(Date.now() / 1000));
  const signature = createHmac("sha256", key).update(`${id}.${timestamp}.${body}`).digest("base64");
  const headers = (sig: string, ts = timestamp) => new Headers({ "svix-id": id, "svix-timestamp": ts, "svix-signature": sig });

  assert.equal(verifyResendWebhook(body, headers(`v1,${signature}`)), true);
  assert.equal(verifyResendWebhook(body, headers(`v1,bogus v1,${signature}`)), true);
  assert.equal(verifyResendWebhook(body.replace("abc", "xyz"), headers(`v1,${signature}`)), false);
  assert.equal(verifyResendWebhook(body, headers(`v1,${signature}`, String(Number(timestamp) - 3600))), false);
});

test("unsubscribe tokens are bound to the address", () => {
  const token = unsubscribeToken("Buyer@Example.com");
  assert.equal(verifyUnsubscribeToken("buyer@example.com", token), true);
  assert.equal(verifyUnsubscribeToken("other@example.com", token), false);
  assert.equal(verifyUnsubscribeToken("buyer@example.com", "x"), false);
});
