const labels: Record<string, string> = {
  NOT_STARTED: "Payment not started", ACTIVE: "Awaiting payment", PENDING: "Payment processing",
  NOT_ATTEMPTED: "Payment not completed", SUCCESS: "Payment confirmed", FAILED: "Last payment attempt failed",
  USER_DROPPED: "Payment interrupted", VOID: "Payment voided", CANCELLED: "Payment cancelled",
  EXPIRED: "Payment session expired", TERMINATED: "Payment session closed", TERMINATION_REQUESTED: "Payment session closing",
  REFUND_PENDING: "Refund processing", PARTIALLY_REFUNDED: "Partially refunded", REFUNDED: "Refund completed",
  REVIEW_REQUIRED: "Payment needs review",
};
export function paymentStatusLabel(status: string) { return labels[status] ?? "Payment status being checked"; }
