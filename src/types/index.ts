export type Role = "CUSTOMER" | "ADMIN";

export type OrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "PROCESSING"
  | "PACKED"
  | "SHIPPED"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED"
  | "CANCELLED"
  | "RETURN_REQUESTED"
  | "RETURN_APPROVED"
  | "RETURN_RECEIVED"
  | "REFUND_PROCESSING"
  | "REFUNDED";

export type CartItem = {
  variantId: string;
  quantity: number;
};
