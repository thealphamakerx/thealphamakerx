export function calculateShippingFee(subtotalInPaise: number) {
  const freeShippingThreshold = 500000; // ₹5,000
  return subtotalInPaise >= freeShippingThreshold ? 0 : 9900; // ₹99
}
