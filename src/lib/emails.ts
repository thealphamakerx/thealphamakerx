import { createHmac, timingSafeEqual } from "node:crypto";
import type { PoolClient } from "pg";
import { z } from "zod";
import { siteConfig } from "@/config/site";
import { sendEmail } from "@/lib/email";
import { createOrderAccessToken, createOrdersKey } from "@/lib/order-token";
import { formatPrice } from "@/lib/pricing";
import { paymentPool, paymentTransaction } from "@/lib/payments/pool";
import {
  DEFAULT_EMAIL_SETTINGS,
  EMAIL_INFO,
  EMAIL_KINDS,
  SAMPLE_VARS,
  renderEmail,
  templateFor,
  type EmailBrand,
  type EmailKind,
  type EmailSettings,
  type EmailVars,
} from "@/lib/email-templates";

// The order email system. Every message is a row in the paymentEmail outbox:
// queued inside the same transaction as the payment change that caused it,
// re-checked just before sending (a reminder never reaches someone who has
// since paid), sent through Resend with the row id as idempotency key, and
// retried with backoff. Resend webhooks record delivery, bounces and complaints.

const MAX_ATTEMPTS = 8;

// ── Settings ────────────────────────────────────────────────────────────────

const templateSchema = z.object({
  enabled: z.boolean().optional(),
  subject: z.string().max(200).optional(),
  heading: z.string().max(200).optional(),
  body: z.string().max(2000).optional(),
  button: z.string().max(60).optional(),
});

export const emailSettingsSchema = z.object({
  templates: z.partialRecord(z.enum(EMAIL_KINDS), templateSchema).catch({}),
  failedDelayMinutes: z.number().int().min(0).max(24 * 60).catch(DEFAULT_EMAIL_SETTINGS.failedDelayMinutes),
  reminder1Hours: z.number().min(0.25).max(24 * 7).catch(DEFAULT_EMAIL_SETTINGS.reminder1Hours),
  reminder2Hours: z.number().min(0.5).max(24 * 14).catch(DEFAULT_EMAIL_SETTINGS.reminder2Hours),
});

type Queryable = Pick<PoolClient, "query">;

export async function getEmailSettings(client: Queryable = paymentPool): Promise<EmailSettings> {
  const { rows: [row] } = await client.query(`SELECT value FROM public."appSetting" WHERE key='emails'`);
  let raw: unknown = {};
  try { raw = JSON.parse(row?.value ?? "{}"); } catch { /* fall back to defaults */ }
  return emailSettingsSchema.parse(raw ?? {}) as EmailSettings;
}

export async function saveEmailSettings(settings: EmailSettings) {
  await paymentPool.query(
    `INSERT INTO public."appSetting" (key,value,"updatedAt") VALUES ('emails',$1,now())
     ON CONFLICT (key) DO UPDATE SET value=EXCLUDED.value,"updatedAt"=now()`,
    [JSON.stringify(settings)]
  );
}

// ── Queueing ────────────────────────────────────────────────────────────────

/** Queue one message; the id makes it happen at most once (e.g. `paid:<orderId>`). */
export async function queueEmail(client: Queryable, id: string, orderId: string, kind: EmailKind, delayMinutes = 0) {
  await client.query(
    `INSERT INTO public."paymentEmail" (id,"orderId",kind,"sendAfter") VALUES ($1,$2,$3,now() + make_interval(mins => $4::int))
     ON CONFLICT (id) DO NOTHING`,
    [id, orderId, kind, delayMinutes]
  );
}

/** Called from the payment state machine when an unpaid order's payment fails or is abandoned. */
export async function queuePaymentFailedEmail(client: Queryable, orderId: string) {
  const { failedDelayMinutes } = await getEmailSettings(client);
  await queueEmail(client, `failed:${orderId}`, orderId, "PAYMENT_FAILED", failedDelayMinutes);
}

/**
 * Queue checkout reminders for unpaid orders past each delay. Only the buyer's
 * most recent checkout gets reminders, and only within 3 days of starting it.
 */
export async function queueCheckoutReminders() {
  const settings = await getEmailSettings();
  let queued = 0;
  for (const [kind, hours] of [["REMINDER_1", settings.reminder1Hours], ["REMINDER_2", settings.reminder2Hours]] as const) {
    const prefix = kind === "REMINDER_1" ? "reminder1" : "reminder2";
    const { rowCount } = await paymentPool.query(
      `INSERT INTO public."paymentEmail" (id,"orderId",kind)
       SELECT $1 || ':' || o.id, o.id, $2
       FROM public."order" o
       WHERE o.status = 'PENDING' AND o.email IS NOT NULL AND o.total > 0
         AND o."createdAt" <= now() - make_interval(secs => $3::float8 * 3600)
         AND o."createdAt" > now() - interval '3 days'
         AND NOT EXISTS (SELECT 1 FROM public."order" n WHERE lower(n.email) = lower(o.email) AND n."createdAt" > o."createdAt")
       ON CONFLICT (id) DO NOTHING`,
      [prefix, kind, hours]
    );
    queued += rowCount ?? 0;
  }
  return queued;
}

// ── Brand, links and variables ─────────────────────────────────────────────

export function emailBrand(): EmailBrand {
  return {
    name: siteConfig.name,
    siteUrl: siteConfig.url,
    logoUrl: `${siteConfig.url}/logo.png`,
    legalName: siteConfig.legalName,
    address: siteConfig.addressLines.join(", "),
    contactEmail: siteConfig.contactEmail,
  };
}

function secret() {
  if (!process.env.BETTER_AUTH_SECRET) throw new Error("BETTER_AUTH_SECRET is not set");
  return process.env.BETTER_AUTH_SECRET;
}

export function unsubscribeToken(email: string) {
  return createHmac("sha256", secret()).update(`unsubscribe:${email.trim().toLowerCase()}`).digest("base64url");
}

export function verifyUnsubscribeToken(email: string, token: string) {
  const expected = Buffer.from(unsubscribeToken(email));
  const given = Buffer.from(token);
  return expected.length === given.length && timingSafeEqual(expected, given);
}

export function unsubscribeUrl(email: string) {
  return `${siteConfig.url}/api/email/unsubscribe?e=${encodeURIComponent(email.toLowerCase())}&t=${unsubscribeToken(email)}`;
}

type OrderRow = { id: string; email: string | null; total: number; source: string | null; createdAt: Date; status: string; paymentStatus: string };

/** Where the buyer finishes an unpaid order: the combo or first product, back through its landing page. */
async function resumeUrl(client: Queryable, order: OrderRow, kind: EmailKind) {
  const { rows: items } = await client.query(`SELECT "productId","offerId" FROM public."orderItem" WHERE "orderId"=$1`, [order.id]);
  const offerId = items.find((i) => i.offerId)?.offerId;
  const { rows: [target] } = offerId
    ? await client.query(`SELECT slug FROM public.offer WHERE id=$1 AND "isActive"`, [offerId])
    : await client.query(`SELECT slug FROM public.product WHERE id=$1`, [items[0]?.productId]);
  const params = new URLSearchParams();
  if (target) params.set(offerId ? "offer" : "product", target.slug);
  if (order.source) params.set("lp", order.source);
  params.set("utm_source", "email");
  params.set("utm_medium", "email");
  params.set("utm_campaign", kind.toLowerCase());
  return target ? `${siteConfig.url}/checkout?${params}` : `${siteConfig.url}/shop`;
}

async function orderVars(client: Queryable, order: OrderRow, kind: EmailKind): Promise<EmailVars> {
  const { rows: items } = await client.query(`SELECT "productName","finalPrice" FROM public."orderItem" WHERE "orderId"=$1 ORDER BY "productName"`, [order.id]);
  const base = {
    orderNumber: order.id.slice(0, 8).toUpperCase(),
    email: order.email ?? "",
    total: formatPrice(order.total),
    items: items.map((i) => ({ name: i.productName, price: formatPrice(i.finalPrice) })),
  };
  const orders = order.email ? { label: "View all your orders", url: `${siteConfig.url}/orders?key=${createOrdersKey(order.email)}` } : undefined;
  switch (EMAIL_INFO[kind].category) {
    case "admin":
      return { ...base, actionUrl: `${siteConfig.url}/admin/orders/${order.id}` };
    case "nudge":
      return { ...base, actionUrl: await resumeUrl(client, order, kind), unsubscribeUrl: order.email ? unsubscribeUrl(order.email) : undefined };
    default:
      return kind === "PAID"
        ? { ...base, actionUrl: `${siteConfig.url}/download/${createOrderAccessToken(order.id)}`, secondaryLink: orders }
        : { ...base, secondaryLink: orders };
  }
}

// ── Delivery ────────────────────────────────────────────────────────────────

/** Why a queued message shouldn't go out any more, or null to send it. */
async function skipReason(client: Queryable, kind: EmailKind, order: OrderRow, settings: EmailSettings) {
  if (!templateFor(settings, kind).enabled) return "turned off in email settings";
  const category = EMAIL_INFO[kind].category;
  if (category !== "admin" && !order.email) return "order has no email";
  if (kind === "PAID" && order.status !== "PAID") return "order is no longer paid";
  if (kind === "ADMIN_NEW_SALE" && order.status !== "PAID") return "order is no longer paid";
  if (category === "nudge") {
    if (order.status !== "PENDING") return "order is no longer awaiting payment";
    const { rows: [suppressed] } = await client.query(`SELECT reason FROM public."emailSuppression" WHERE email=lower($1)`, [order.email]);
    if (suppressed) return `address ${suppressed.reason}`;
    const { rows: [paid] } = await client.query(
      `SELECT 1 FROM public."order" WHERE lower(email)=lower($1) AND status='PAID' AND "createdAt" >= $2 LIMIT 1`, [order.email, order.createdAt]);
    if (paid) return "buyer paid in another order";
    if (kind !== "PAYMENT_FAILED") {
      const { rows: [newer] } = await client.query(`SELECT 1 FROM public."order" WHERE lower(email)=lower($1) AND "createdAt" > $2 LIMIT 1`, [order.email, order.createdAt]);
      if (newer) return "buyer started a newer checkout";
    }
    if (kind === "REMINDER_1") {
      const { rows: [failed] } = await client.query(`SELECT 1 FROM public."paymentEmail" WHERE id=$1 AND "sentAt" IS NOT NULL`, [`failed:${order.id}`]);
      if (failed) return "payment-failed email already sent";
    }
  }
  return null;
}

function recipientFor(kind: EmailKind, order: OrderRow) {
  return EMAIL_INFO[kind].category === "admin" ? (process.env.ADMIN_NOTIFY_EMAIL || siteConfig.contactEmail) : order.email!;
}

/** Send due messages, oldest first. Safe to run concurrently (rows are locked while sending). */
export async function deliverEmails(limit = 10) {
  let sent = 0;
  const settings = await getEmailSettings();
  for (let index = 0; index < limit; index++) {
    const processed = await paymentTransaction(async (client) => {
      const { rows: [email] } = await client.query(`SELECT * FROM public."paymentEmail"
        WHERE "sentAt" IS NULL AND "skippedReason" IS NULL AND attempts < ${MAX_ATTEMPTS} AND "sendAfter" <= now()
        ORDER BY "sendAfter","createdAt" LIMIT 1 FOR UPDATE SKIP LOCKED`);
      if (!email) return false;
      const kind = (EMAIL_KINDS as readonly string[]).includes(email.kind) ? (email.kind as EmailKind) : null;
      const { rows: [order] } = await client.query('SELECT * FROM public."order" WHERE id=$1', [email.orderId]);
      if (!kind || !order) {
        await client.query(`UPDATE public."paymentEmail" SET "skippedReason"=$2 WHERE id=$1`, [email.id, "unknown message or order"]);
        return true;
      }
      const reason = await skipReason(client, kind, order, settings);
      if (reason) {
        await client.query(`UPDATE public."paymentEmail" SET "skippedReason"=$2 WHERE id=$1`, [email.id, reason]);
        return true;
      }
      const to = recipientFor(kind, order);
      try {
        const message = renderEmail(kind, templateFor(settings, kind), await orderVars(client, order, kind), emailBrand());
        const unsubscribe = EMAIL_INFO[kind].category === "nudge" ? unsubscribeUrl(to) : null;
        const providerId = await sendEmail({
          to,
          subject: message.subject,
          html: message.html,
          text: message.text,
          idempotencyKey: email.id,
          tags: [{ name: "kind", value: kind.toLowerCase() }],
          headers: unsubscribe ? { "List-Unsubscribe": `<${unsubscribe}>`, "List-Unsubscribe-Post": "List-Unsubscribe=One-Click" } : undefined,
        });
        await client.query(`UPDATE public."paymentEmail" SET "sentAt"=now(),attempts=attempts+1,recipient=$2,"providerId"=$3,"lastError"=NULL,"deliveryStatus"='sent',"deliveryUpdatedAt"=now() WHERE id=$1`,
          [email.id, to, providerId]);
        sent++;
      } catch (error) {
        const message = error instanceof Error ? error.message.slice(0, 300) : "Send failed";
        // Back off 1, 4, 9, 16… minutes between attempts.
        await client.query(`UPDATE public."paymentEmail" SET attempts=attempts+1,recipient=$2,"lastError"=$3,
          "sendAfter"=now() + make_interval(mins => power(attempts+1, 2)::int) WHERE id=$1`, [email.id, to, message]);
        console.error(`Email ${email.id} not sent: ${message}`);
      }
      return true;
    });
    if (!processed) break;
  }
  return sent;
}

/** Queue a fresh copy of an earlier message, sent on the next delivery run. */
export async function resendEmail(id: string) {
  const { rows: [original] } = await paymentPool.query(`SELECT * FROM public."paymentEmail" WHERE id=$1`, [id]);
  if (!original) return null;
  const copyId = `${original.id.split("#")[0]}#${Date.now().toString(36)}`;
  await paymentPool.query(`INSERT INTO public."paymentEmail" (id,"orderId",kind) VALUES ($1,$2,$3)`, [copyId, original.orderId, original.kind]);
  return copyId;
}

/** A sample of one template, sent straight away (not queued). */
export async function sendTestEmail(kind: EmailKind, to: string, settings?: EmailSettings) {
  const current = settings ?? (await getEmailSettings());
  const vars: EmailVars = { ...SAMPLE_VARS, actionUrl: siteConfig.url, secondaryLink: { label: "View all your orders", url: `${siteConfig.url}/orders` }, unsubscribeUrl: EMAIL_INFO[kind].category === "nudge" ? unsubscribeUrl(to) : undefined };
  const message = renderEmail(kind, { ...templateFor(current, kind), enabled: true }, vars, emailBrand());
  return sendEmail({ to, subject: `[Test] ${message.subject}`, html: message.html, text: message.text, tags: [{ name: "kind", value: "test" }] });
}

// ── Resend webhooks ────────────────────────────────────────────────────────

/** Verify a Svix-signed webhook (Resend uses Svix): HMAC-SHA256 over "id.timestamp.body". */
export function verifyResendWebhook(body: string, headers: Headers) {
  const secretValue = process.env.RESEND_WEBHOOK_SECRET;
  const id = headers.get("svix-id");
  const timestamp = headers.get("svix-timestamp");
  const signatures = headers.get("svix-signature");
  if (!secretValue || !id || !timestamp || !signatures) return false;
  if (Math.abs(Date.now() / 1000 - Number(timestamp)) > 5 * 60) return false;
  const key = Buffer.from(secretValue.replace(/^whsec_/, ""), "base64");
  const expected = createHmac("sha256", key).update(`${id}.${timestamp}.${body}`).digest("base64");
  return signatures.split(" ").some((entry) => {
    const [, signature] = entry.split(",");
    if (!signature) return false;
    const a = Buffer.from(signature);
    const b = Buffer.from(expected);
    return a.length === b.length && timingSafeEqual(a, b);
  });
}

const DELIVERY_EVENTS: Record<string, string> = {
  "email.sent": "sent",
  "email.delivered": "delivered",
  "email.delivery_delayed": "delayed",
  "email.bounced": "bounced",
  "email.complained": "complained",
  "email.opened": "opened",
  "email.clicked": "clicked",
  "email.failed": "failed",
};

// A later event never downgrades an earlier, more final one (e.g. opened → delivered).
const RANK: Record<string, number> = { sent: 1, delayed: 2, delivered: 3, opened: 4, clicked: 5, failed: 6, bounced: 7, complained: 8 };

export async function applyResendEvent(event: { type: string; data?: { email_id?: string; to?: string[]; bounce?: { type?: string } } }) {
  const status = DELIVERY_EVENTS[event.type];
  const providerId = event.data?.email_id;
  if (!status || !providerId) return;
  const { rows: [row] } = await paymentPool.query(`SELECT id,"deliveryStatus" FROM public."paymentEmail" WHERE "providerId"=$1`, [providerId]);
  if (row && (RANK[status] ?? 0) >= (RANK[row.deliveryStatus] ?? 0)) {
    await paymentPool.query(`UPDATE public."paymentEmail" SET "deliveryStatus"=$2,"deliveryUpdatedAt"=now() WHERE id=$1`, [row.id, status]);
  }
  // Hard bounces and spam complaints stop further reminders to that address.
  const permanentBounce = status === "bounced" && (event.data?.bounce?.type ?? "Permanent") === "Permanent";
  if (permanentBounce || status === "complained") {
    for (const to of event.data?.to ?? []) {
      await paymentPool.query(`INSERT INTO public."emailSuppression" (email,reason) VALUES (lower($1),$2) ON CONFLICT (email) DO NOTHING`,
        [to, status === "complained" ? "marked as spam" : "bounced"]);
    }
  }
}

export async function suppressEmail(email: string, reason: string) {
  await paymentPool.query(`INSERT INTO public."emailSuppression" (email,reason) VALUES (lower($1),$2) ON CONFLICT (email) DO UPDATE SET reason=EXCLUDED.reason`, [email, reason]);
}
