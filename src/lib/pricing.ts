export function formatPrice(amountInPaise: number, currency = "INR") {
  // Whole-rupee amounts read cleaner without ".00"; paise still show when present.
  const whole = amountInPaise % 100 === 0;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    minimumFractionDigits: whole ? 0 : 2,
    maximumFractionDigits: whole ? 0 : 2,
  }).format(amountInPaise / 100);
}

/**
 * Percentage off, rounded, or null when there's no genuine discount to show
 * (no original price, or one that isn't actually higher than what's charged).
 */
export function discountPercent(price: number, originalPrice?: number | null) {
  if (!originalPrice || originalPrice <= price) return null;
  return Math.round(((originalPrice - price) / originalPrice) * 100);
}
