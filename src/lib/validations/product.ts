import { z } from "zod";

export const productSchema = z.object({
  name: z.string().min(1),
  shortName: z.string().min(1).nullable().optional(),
  slug: z.string().min(1),
  description: z.string().nullable().optional(),
  // Both in paise. `originalPrice` is the strike-through "was" price; it's
  // only rendered when it's higher than `price`.
  price: z.number().int().nonnegative(),
  originalPrice: z.number().int().nonnegative().nullable().optional(),
  badge: z.string().nullable().optional(),
  iconName: z.string().optional(),
  color: z.string().optional(),
  isActive: z.boolean().optional(),
  features: z.array(z.string().min(1)).optional(),
  // Ordered gallery; the first image is the cover. Replaces the whole set.
  images: z.array(z.object({ url: z.string().url().max(1000), alt: z.string().max(200).nullable().optional() })).max(12).optional(),
  digitalAccessUrl: z.string().url().nullable().optional().or(z.literal("")),
  // Social proof carried over from before reviews were collected here; null = use real reviews.
  ratingOverride: z.number().min(0).max(5).nullable().optional(),
  reviewCountOverride: z.number().int().min(0).nullable().optional(),
});

export type ProductInput = z.infer<typeof productSchema>;

/** Field-by-field edits from the admin Products page. */
export const productUpdateSchema = productSchema.partial();
