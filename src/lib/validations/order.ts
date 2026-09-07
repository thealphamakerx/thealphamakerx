import { z } from "zod";

export const shippingAddressSchema = z.object({
  fullName: z.string().min(1),
  phone: z.string().min(10),
  line1: z.string().min(1),
  line2: z.string().optional(),
  city: z.string().min(1),
  state: z.string().min(1),
  postalCode: z.string().min(4),
  country: z.string().min(1),
});

export type ShippingAddressInput = z.infer<typeof shippingAddressSchema>;
