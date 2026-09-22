interface Window {
  Cashfree?: (options: { mode: "sandbox" | "production" }) => {
    checkout: (options: { paymentSessionId: string; redirectTarget: "_self" }) => Promise<{ error?: { message?: string }; paymentDetails?: unknown } | undefined>;
  };
}
