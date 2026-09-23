interface Window {
  Cashfree?: (options: { mode: "sandbox" | "production" }) => {
    checkout: (options: { paymentSessionId: string; redirectTarget: "_self" }) => Promise<{ error?: { message?: string }; redirect?: boolean; paymentDetails?: unknown } | undefined>;
  };
}
