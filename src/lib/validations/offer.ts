import { z } from "zod";
import { SLUG_RE } from "@/lib/landing";

export const offerSchema = z.object({
  name: z.string().trim().min(1).max(120),
  slug: z.string().trim().toLowerCase().regex(SLUG_RE, "Use lowercase letters, numbers and dashes").max(80),
  description: z.string().trim().max(600).nullable().optional(),
  // Paise.
  price: z.number().int().min(100).max(100_000_00),
  badge: z.string().trim().max(30).nullable().optional(),
  isActive: z.boolean().default(true),
  position: z.number().int().min(0).max(1000).default(0),
  productIds: z.array(z.string().min(1)).min(2, "A combo needs at least two products").max(10),
});
