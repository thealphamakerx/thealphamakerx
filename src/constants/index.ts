export const NAV_LINKS = [
  { label: "All Products", href: "/shop" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
] as const;

export const FOOTER_LINKS = {
  shop: [
    { label: "All Products", href: "/shop" },
    { label: "About Us", href: "/about" },
    { label: "Contact", href: "/contact" },
  ],
  legal: [
    { label: "Privacy Policy", href: "/privacy-policy" },
    { label: "Terms & Conditions", href: "/terms" },
    { label: "Refund & Cancellation Policy", href: "/refund-policy" },
    { label: "Shipping & Delivery Policy", href: "/shipping-policy" },
  ],
  account: [
    { label: "My Account", href: "/account" },
    { label: "My Orders", href: "/account/orders" },
    { label: "Wishlist", href: "/account/wishlist" },
    { label: "Cart", href: "/cart" },
  ],
} as const;

export const ORDER_STATUS_LABELS = {
  PENDING: "Pending",
  PAID: "Paid — Access Unlocked",
  CANCELLED: "Cancelled",
  REFUNDED: "Refunded",
} as const;

export const USER_ROLES = {
  CUSTOMER: "CUSTOMER",
  ADMIN: "ADMIN",
} as const;
