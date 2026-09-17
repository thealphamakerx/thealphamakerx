import { z } from "zod";

export const productSchema = z.object({
  name: z.string().min(1),
  shortName: z.string().min(1).optional(),
  slug: z.string().min(1),
  description: z.string().optional(),
  // Both in paise. `originalPrice` is the strike-through "was" price; it's
  // only rendered when it's higher than `price`.
  price: z.number().int().nonnegative(),
  originalPrice: z.number().int().nonnegative().optional(),
  badge: z.string().optional(),
  iconName: z.string().optional(),
  color: z.string().optional(),
  isActive: z.boolean().optional(),
  features: z.array(z.string().min(1)).optional(),
  digitalAccessUrl: z.string().url().optional(),
});

export type ProductInput = z.infer<typeof productSchema>;

/** Field-by-field edits from the admin Products page. */
export const productUpdateSchema = productSchema.partial();
