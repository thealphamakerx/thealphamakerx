import { Resend } from "resend";
import { formatPrice } from "@/lib/pricing";
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

const STATUS_EMAIL_COPY: Partial<Record<string, { subject: string; body: string }>> = {
  CANCELLED: {
    subject: "Your order was cancelled",
    body: "Your order has been cancelled.",
  },
  REFUNDED: {
    subject: "Your refund has been processed",
    body: "Your refund has been processed and should reflect in your account soon.",
  },
};

export async function sendOrderStatusEmail({
  to,
  orderId,
  status,
  idempotencyKey,
}: {
  to: string;
  orderId: string;
  status: string;
  idempotencyKey?: string;
}) {
  const copy = STATUS_EMAIL_COPY[status];
  if (!copy) return;

  const resend = getResendClient();
  if (!resend) throw new Error("Email service is unavailable");

  const { error } = await resend.emails.send({
    from: FROM,
    to,
    subject: `${copy.subject} — #${orderId.slice(0, 8).toUpperCase()}`,
    html: `<p>${copy.body}</p><p>Order #${orderId.slice(0, 8).toUpperCase()}</p>`,
  }, idempotencyKey ? { idempotencyKey } : undefined);
  if (error) throw new Error("Status email could not be sent");
}

export async function sendOrderConfirmationEmail({
  to,
  orderId,
  total,
  downloadUrl,
  idempotencyKey,
}: {
  to: string;
  orderId: string;
  total: number;
  /** Guest orders don't have an account Purchases page — link straight to
   *  the token-protected public download page instead. */
  downloadUrl?: string;
  idempotencyKey?: string;
}) {
  const resend = getResendClient();
  if (!resend) throw new Error("Email service is unavailable");

  const { error } = await resend.emails.send({
    from: FROM,
    to,
    subject: `You're in! — #${orderId.slice(0, 8).toUpperCase()}`,
    html: `
      <p>Your purchase is confirmed and your access is unlocked.</p>
      <p><strong>Order:</strong> #${orderId.slice(0, 8).toUpperCase()}</p>
      <p><strong>Total:</strong> ${formatPrice(total)}</p>
      ${
        downloadUrl
          ? `<p><a href="${downloadUrl}">Click here to get your files</a></p>`
          : `<p>You can access it any time from your account's Purchases page.</p>`
      }
    `,
  }, idempotencyKey ? { idempotencyKey } : undefined);
  if (error) throw new Error("Confirmation email could not be sent");
}
