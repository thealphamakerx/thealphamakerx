import Razorpay from "razorpay";
import crypto from "crypto";

// Lazy singleton: the Razorpay constructor throws synchronously when
// key_id is missing, which would otherwise crash route module evaluation
// (and the build's page-data collection step) in any environment where
// RAZORPAY_KEY_ID isn't set yet. Only pay that cost when a request
// actually needs the client.
let razorpayClient: Razorpay | undefined;

export function getRazorpay(): Razorpay {
  if (!razorpayClient) {
    razorpayClient = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID!,
      key_secret: process.env.RAZORPAY_KEY_SECRET!,
    });
  }
  return razorpayClient;
}

export function verifyPaymentSignature({
  orderId,
  paymentId,
  signature,
}: {
  orderId: string;
  paymentId: string;
  signature: string;
}) {
  const expected = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");

  return expected === signature;
}

export function verifyWebhookSignature({
  body,
  signature,
}: {
  body: string;
  signature: string;
}) {
  const expected = crypto
    .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET!)
    .update(body)
    .digest("hex");

  return expected === signature;
}
