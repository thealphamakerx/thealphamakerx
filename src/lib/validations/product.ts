import { z } from "zod";

export const productSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  description: z.string().optional(),
  price: z.number().int().nonnegative(),
  categoryId: z.string(),
});

export type ProductInput = z.infer<typeof productSchema>;
