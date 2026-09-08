export type Role = "CUSTOMER" | "ADMIN";

export type OrderStatus = "PENDING" | "PAID" | "CANCELLED" | "REFUNDED";

export type CartItem = {
  productId: string;
  quantity: number;
};
