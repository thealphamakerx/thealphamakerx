// Email templates: defaults, admin overrides and rendering to HTML + text.
// Pure functions with no secrets or I/O, so the admin editor renders the
// exact same preview in the browser that the server sends.

export const EMAIL_KINDS = [
  "PAID",
  "PAYMENT_FAILED",
  "REMINDER_1",
  "REMINDER_2",
  "REFUND_PROCESSING",
  "REFUNDED",
  "ADMIN_NEW_SALE",
] as const;
export type EmailKind = (typeof EMAIL_KINDS)[number];

/** Receipts always go out; nudges respect unsubscribes; admin mail goes to you. */
export type EmailCategory = "transactional" | "nudge" | "admin";

export type TemplateText = {
  enabled: boolean;
  subject: string;
  heading: string;
  body: string;
  button: string;
};

export const EMAIL_INFO: Record<EmailKind, { name: string; when: string; category: EmailCategory }> = {
  PAID: { name: "Order confirmed", when: "As soon as payment is confirmed", category: "transactional" },
  PAYMENT_FAILED: { name: "Payment failed", when: "Shortly after a payment fails or is abandoned, if still unpaid", category: "nudge" },
  REMINDER_1: { name: "Checkout reminder", when: "When a checkout is still unpaid after the first delay", category: "nudge" },
  REMINDER_2: { name: "Final reminder", when: "When a checkout is still unpaid after the second delay", category: "nudge" },
  REFUND_PROCESSING: { name: "Refund processing", when: "When you start a refund", category: "transactional" },
  REFUNDED: { name: "Refund completed", when: "When the payment gateway confirms the refund", category: "transactional" },
  ADMIN_NEW_SALE: { name: "New sale (to you)", when: "Each paid order — sent to your admin address", category: "admin" },
};

// Placeholders: {{product}} {{total}} {{order}} {{email}} {{site}}
export const DEFAULT_TEMPLATES: Record<EmailKind, TemplateText> = {
  PAID: {
    enabled: true,
    subject: "You're in! Your order #{{order}} is confirmed",
    heading: "Your purchase is confirmed",
    body: "Thank you for your order. Your access to {{product}} is unlocked — download it below any time. We've also saved it on your My Orders page.",
    button: "Download your files",
  },
  PAYMENT_FAILED: {
    enabled: true,
    subject: "Your payment didn't go through",
    heading: "Your payment didn't complete",
    body: "It looks like your payment for {{product}} didn't go through, so you haven't been charged. Your order is saved — you can finish it in a minute.",
    button: "Complete your purchase",
  },
  REMINDER_1: {
    enabled: true,
    subject: "You left {{product}} in checkout",
    heading: "Still thinking it over?",
    body: "You started checking out {{product}} but didn't finish. Your order is saved — pick up where you left off whenever you're ready.",
    button: "Finish checkout",
  },
  REMINDER_2: {
    enabled: true,
    subject: "Last reminder: {{product}} is waiting for you",
    heading: "Your order is still waiting",
    body: "Just a final reminder that {{product}} is still in your checkout. Instant download, lifetime access — it takes less than a minute to finish.",
    button: "Get instant access",
  },
  REFUND_PROCESSING: {
    enabled: true,
    subject: "Your refund for order #{{order}} is being processed",
    heading: "Your refund is on its way",
    body: "We've started a refund of {{total}} for order #{{order}}. It's processed by our payment partner and usually reaches your original payment method within 5–7 working days.",
    button: "",
  },
  REFUNDED: {
    enabled: true,
    subject: "Your refund for order #{{order}} is complete",
    heading: "Your refund is complete",
    body: "Your refund of {{total}} for order #{{order}} has been completed. It should appear in your account shortly, depending on your bank.",
    button: "",
  },
  ADMIN_NEW_SALE: {
    enabled: true,
    subject: "New sale: {{total}} — {{product}}",
    heading: "You made a sale",
    body: "{{email}} just bought {{product}} for {{total}} (order #{{order}}).",
    button: "View order",
  },
};

export type EmailSettings = {
  templates: Partial<Record<EmailKind, Partial<TemplateText>>>;
  /** Minutes after a failed/abandoned payment before the "payment failed" email. */
  failedDelayMinutes: number;
  /** Hours after checkout started before each reminder. */
  reminder1Hours: number;
  reminder2Hours: number;
};

export const DEFAULT_EMAIL_SETTINGS: EmailSettings = {
  templates: {},
  failedDelayMinutes: 15,
  reminder1Hours: 1,
  reminder2Hours: 24,
};

export function templateFor(settings: EmailSettings, kind: EmailKind): TemplateText {
  const override = settings.templates[kind] ?? {};
  const base = DEFAULT_TEMPLATES[kind];
  return {
    enabled: override.enabled ?? base.enabled,
    subject: override.subject?.trim() || base.subject,
    heading: override.heading?.trim() || base.heading,
    body: override.body?.trim() || base.body,
    button: override.button ?? base.button,
  };
}

export type EmailBrand = {
  name: string;
  siteUrl: string;
  logoUrl: string;
  legalName: string;
  address: string;
  contactEmail: string;
};

export type EmailVars = {
  orderNumber: string;
  email: string;
  total: string;
  items: { name: string; price: string }[];
  /** Where the main button goes. */
  actionUrl?: string;
  /** Secondary link under the button, e.g. all orders. */
  secondaryLink?: { label: string; url: string };
  unsubscribeUrl?: string;
};

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function fill(text: string, vars: EmailVars, brand: EmailBrand) {
  const product = vars.items.length === 1 ? vars.items[0].name : vars.items.length === 2 ? `${vars.items[0].name} and ${vars.items[1].name}` : `${vars.items.length} products`;
  return text
    .replace(/\{\{\s*product\s*\}\}/g, product)
    .replace(/\{\{\s*total\s*\}\}/g, vars.total)
    .replace(/\{\{\s*order\s*\}\}/g, vars.orderNumber)
    .replace(/\{\{\s*email\s*\}\}/g, vars.email)
    .replace(/\{\{\s*site\s*\}\}/g, brand.name);
}

const C = { bg: "#f4f1f1", card: "#ffffff", ink: "#1c1415", muted: "#6b6264", line: "#ece6e6", brand: "#b00b1a" };

/** Subject, HTML (table layout for mail clients) and a plain-text alternative. */
export function renderEmail(kind: EmailKind, template: TemplateText, vars: EmailVars, brand: EmailBrand) {
  const subject = fill(template.subject, vars, brand);
  const heading = fill(template.heading, vars, brand);
  const body = fill(template.body, vars, brand);
  const button = template.button.trim() && vars.actionUrl ? fill(template.button, vars, brand) : "";
  const preheader = body.slice(0, 110);

  const itemRows = vars.items
    .map((i) => `<tr><td style="padding:8px 0;border-bottom:1px solid ${C.line};color:${C.ink};font-size:14px">${esc(i.name)}</td><td align="right" style="padding:8px 0;border-bottom:1px solid ${C.line};color:${C.ink};font-size:14px;white-space:nowrap">${esc(i.price)}</td></tr>`)
    .join("");

  const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><title>${esc(subject)}</title></head>
<body style="margin:0;padding:0;background:${C.bg};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif">
<div style="display:none;max-height:0;overflow:hidden;opacity:0">${esc(preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.bg}"><tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px">
  <tr><td align="center" style="background:#0f0a0b;border-radius:14px 14px 0 0;padding:20px">
    <a href="${esc(brand.siteUrl)}" style="text-decoration:none"><img src="${esc(brand.logoUrl)}" width="150" alt="${esc(brand.name)}" style="display:block;border:0;max-width:150px;height:auto"></a>
  </td></tr>
  <tr><td style="background:${C.card};padding:32px 28px;border-radius:0 0 14px 14px">
    <h1 style="margin:0 0 14px;font-size:22px;line-height:1.3;color:${C.ink}">${esc(heading)}</h1>
    <p style="margin:0 0 22px;font-size:15px;line-height:1.6;color:${C.ink}">${esc(body).replace(/\n/g, "<br>")}</p>
    ${button ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 24px"><tr><td style="background:${C.brand};border-radius:999px"><a href="${esc(vars.actionUrl!)}" style="display:inline-block;padding:13px 28px;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none">${esc(button)}</a></td></tr></table>` : ""}
    ${vars.items.length ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 8px">${itemRows}
      <tr><td style="padding:10px 0 0;color:${C.ink};font-size:15px;font-weight:700">Total</td><td align="right" style="padding:10px 0 0;color:${C.ink};font-size:15px;font-weight:700">${esc(vars.total)}</td></tr></table>
      <p style="margin:0 0 18px;font-size:12px;color:${C.muted}">Order #${esc(vars.orderNumber)}</p>` : ""}
    ${vars.secondaryLink ? `<p style="margin:0;font-size:13px"><a href="${esc(vars.secondaryLink.url)}" style="color:${C.brand}">${esc(vars.secondaryLink.label)}</a></p>` : ""}
  </td></tr>
  <tr><td align="center" style="padding:18px 12px;font-size:12px;line-height:1.6;color:${C.muted}">
    ${esc(brand.legalName)} · ${esc(brand.address)}<br>
    Questions? Reply to this email or write to <a href="mailto:${esc(brand.contactEmail)}" style="color:${C.muted}">${esc(brand.contactEmail)}</a>
    ${vars.unsubscribeUrl ? `<br><a href="${esc(vars.unsubscribeUrl)}" style="color:${C.muted}">Unsubscribe from reminders</a>` : ""}
  </td></tr>
</table></td></tr></table></body></html>`;

  const text = [
    heading,
    "",
    body,
    button ? `\n${button}: ${vars.actionUrl}` : "",
    vars.items.length ? `\n${vars.items.map((i) => `- ${i.name}: ${i.price}`).join("\n")}\nTotal: ${vars.total}\nOrder #${vars.orderNumber}` : "",
    vars.secondaryLink ? `\n${vars.secondaryLink.label}: ${vars.secondaryLink.url}` : "",
    `\n—\n${brand.legalName} · ${brand.address}\n${brand.contactEmail}`,
    vars.unsubscribeUrl ? `Unsubscribe from reminders: ${vars.unsubscribeUrl}` : "",
  ].filter(Boolean).join("\n");

  return { subject, html, text, kind };
}

/** Example data for previews and test sends. */
export const SAMPLE_VARS: EmailVars = {
  orderNumber: "A1B2C3D4",
  email: "buyer@example.com",
  total: "₹999",
  items: [{ name: "The Confidence Code", price: "₹999" }],
  actionUrl: "https://example.com",
  secondaryLink: { label: "View all your orders", url: "https://example.com/orders" },
};
