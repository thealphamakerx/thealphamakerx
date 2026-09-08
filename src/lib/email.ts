import { Resend } from "resend";
import { formatPrice } from "@/lib/pricing";

export const resend = new Resend(process.env.RESEND_API_KEY);

const FROM = process.env.RESEND_FROM_EMAIL ?? "orders@thealphamakerx.in";

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
}: {
  to: string;
  orderId: string;
  status: string;
}) {
  const copy = STATUS_EMAIL_COPY[status];
  if (!copy) return;

  await resend.emails.send({
    from: FROM,
    to,
    subject: `${copy.subject} — #${orderId.slice(0, 8).toUpperCase()}`,
    html: `<p>${copy.body}</p><p>Order #${orderId.slice(0, 8).toUpperCase()}</p>`,
  });
}

export async function sendOrderConfirmationEmail({
  to,
  orderId,
  total,
}: {
  to: string;
  orderId: string;
  total: number;
}) {
  await resend.emails.send({
    from: FROM,
    to,
    subject: `You're in! — #${orderId.slice(0, 8).toUpperCase()}`,
    html: `
      <p>Your purchase is confirmed and your access is unlocked.</p>
      <p><strong>Order:</strong> #${orderId.slice(0, 8).toUpperCase()}</p>
      <p><strong>Total:</strong> ${formatPrice(total)}</p>
      <p>You can access it any time from your account's Purchases page.</p>
    `,
  });
}
