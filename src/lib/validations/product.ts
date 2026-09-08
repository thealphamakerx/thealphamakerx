import { z } from "zod";

export const productSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  description: z.string().optional(),
  price: z.number().int().nonnegative(),
  badge: z.string().optional(),
  digitalAccessUrl: z.string().url().optional(),
});

export type ProductInput = z.infer<typeof productSchema>;
