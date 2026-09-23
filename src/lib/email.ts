import { Resend } from "resend";
import { siteConfig } from "@/config/site";

// Lazy singleton: constructing Resend() throws synchronously when the API
// key is missing, which would otherwise crash route module evaluation (and
// the build's page-data collection step) in any environment where
// RESEND_API_KEY isn't set yet. Only pay that cost when an email is
// actually sent.
let resendClient: Resend | null | undefined;

function getResendClient(): Resend | null {
  if (resendClient !== undefined) return resendClient;

  if (!process.env.RESEND_API_KEY) {
    console.warn("RESEND_API_KEY is not set — skipping email send.");
    resendClient = null;
    return resendClient;
  }

  resendClient = new Resend(process.env.RESEND_API_KEY);
  return resendClient;
}

const FROM = process.env.RESEND_FROM_EMAIL ?? "orders@thealphamakerx.in";
// Replies from buyers go to the support inbox rather than the sending address.
const REPLY_TO = process.env.RESEND_REPLY_TO || siteConfig.contactEmail;

export async function sendContactEmail({ name, email, message }: {
  name: string;
  email: string;
  message: string;
}) {
  const resend = getResendClient();
  if (!resend) throw new Error("Email service is unavailable");

  const { error } = await resend.emails.send({
    from: FROM,
    to: siteConfig.contactEmail,
    replyTo: email,
    subject: "New website contact enquiry",
    text: `Name: ${name}\nEmail: ${email}\n\n${message}`,
  });
  if (error) throw new Error("Contact email could not be sent");
}

/**
 * Send one email through Resend and return its message id. `idempotencyKey`
 * makes retries safe: Resend delivers a given key at most once.
 */
export async function sendEmail({
  to,
  subject,
  html,
  text,
  idempotencyKey,
  tags,
  headers,
}: {
  to: string;
  subject: string;
  html: string;
  text?: string;
  idempotencyKey?: string;
  tags?: { name: string; value: string }[];
  headers?: Record<string, string>;
}) {
  const resend = getResendClient();
  if (!resend) throw new Error("Email service is unavailable (RESEND_API_KEY is not set)");

  const { data, error } = await resend.emails.send(
    { from: FROM, to, subject, html, text, tags, headers, replyTo: REPLY_TO },
    idempotencyKey ? { idempotencyKey } : undefined
  );
  if (error) throw new Error(`Resend: ${error.message}`);
  return data?.id ?? null;
}

export async function sendOrdersLinkEmail({ to, ordersUrl }: { to: string; ordersUrl: string }) {
  const resend = getResendClient();
  if (!resend) throw new Error("Email service is unavailable");

  const { error } = await resend.emails.send({
    from: FROM,
    to,
    subject: "Your orders",
    html: `
      <p>Here's the link to every purchase made with this email address.</p>
      <p><a href="${ordersUrl}">View your orders and downloads</a></p>
      <p>Keep this email — the link always works. If you didn't request it, you can ignore it.</p>
    `,
  });
  if (error) throw new Error("Orders email could not be sent");
}
