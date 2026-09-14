interface RazorpayCheckoutOptions {
  key: string;
  amount: number;
  currency: string;
  order_id: string;
  name: string;
  description?: string;
  handler: (response: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  }) => void;
  prefill?: { name?: string; email?: string };
  notes?: Record<string, string>;
  theme?: { color?: string };
  modal?: { ondismiss?: () => void };
}

interface RazorpayPaymentFailedResponse {
  error: {
    code: string;
    description: string;
    reason?: string;
    metadata?: { order_id?: string; payment_id?: string };
  };
}

interface RazorpayCheckout {
  open: () => void;
  on: (event: "payment.failed", callback: (response: RazorpayPaymentFailedResponse) => void) => void;
}

interface Window {
  Razorpay?: new (options: RazorpayCheckoutOptions) => RazorpayCheckout;
}
