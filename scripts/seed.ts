// Catalog seed / sync script. Run with: node scripts/seed.ts
// Requires DATABASE_URL / DATABASE_URL_UNPOOLED / BETTER_AUTH_SECRET etc.
// already set (loads .env.local via dotenv, same as the app).
//
// Idempotent and non-destructive: creates the admin user and any missing
// starter products. Existing products are never touched — edit them in
// Admin → Products.
import "./load-env.ts";
import { auth, authPool } from "../src/lib/auth.ts";
import { db } from "../src/prisma/db.ts";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@thealphamakerx.in";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "ChangeMe123!";
const ADMIN_NAME = "Admin";

async function seedAdmin() {
  const existing = await authPool.query('select id from "user" where email = $1', [ADMIN_EMAIL]);

  if (existing.rows.length > 0) {
    await authPool.query('update "user" set role = $1 where email = $2', ["ADMIN", ADMIN_EMAIL]);
    console.log(`Admin user already existed (${ADMIN_EMAIL}) — role ensured as ADMIN.`);
    return;
  }

  await auth.api.signUpEmail({
    body: { name: ADMIN_NAME, email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
  });
  await authPool.query('update "user" set role = $1 where email = $2', ["ADMIN", ADMIN_EMAIL]);
  console.log(`Created admin user: ${ADMIN_EMAIL}`);
}

// Real catalog copy. Upload the actual .xlsx from the admin Products page
// (stored in Cloudflare R2) — or set digitalAccessUrl — once the real
// spreadsheets exist. Prices are in paise; `originalPrice` drives the
// strike-through and the % off badge.
type SeedProduct = {
  name: string;
  shortName: string;
  slug: string;
  description: string;
  price: number;
  originalPrice: number;
  badge?: string;
  iconName: string;
  color: string;
  features: string[];
};

const PRODUCTS: SeedProduct[] = [
  {
    name: "Ultimate Fitness Tracker",
    shortName: "Fitness Tracker",
    slug: "ultimate-fitness-tracker",
    description:
      "The all-in-one Excel spreadsheet to track workouts, nutrition, body measurements, sleep, water intake and more. Beautiful charts auto-generated.\n\nInstant digital download (.xlsx). Opens in Microsoft Excel or Google Sheets — works on phone, tablet, or laptop.",
    price: 14900,
    originalPrice: 59900,
    badge: "Best Seller",
    iconName: "Dumbbell",
    color: "emerald",
    features: [
      "Daily workout log with exercise library",
      "Calorie & macro nutrition tracker",
      "Body measurement progress charts",
      "Sleep & water intake tracking",
      "Auto-generated weekly/monthly graphs",
      "BMI & body fat calculator",
      "Printable & works on mobile",
      "Lifetime free updates",
    ],
  },
  {
    name: "Workout Log Pro",
    shortName: "Workout Log",
    slug: "workout-log-pro",
    description:
      "A detailed workout tracking Excel sheet with exercise database, set/rep logging, progressive overload tracking and strength progress charts.\n\nInstant digital download (.xlsx). Opens in Microsoft Excel or Google Sheets.",
    price: 14900,
    originalPrice: 39900,
    iconName: "TrendingUp",
    color: "blue",
    features: [
      "200+ exercise database",
      "Set, rep & weight logging",
      "Progressive overload tracker",
      "Strength progress charts",
      "Rest day planner",
      "Personal records dashboard",
    ],
  },
  {
    name: "Nutrition & Diet Planner",
    shortName: "Diet Planner",
    slug: "nutrition-diet-planner",
    description:
      "Plan your meals, track macros, count calories and visualise your nutrition journey with beautiful auto-charts in Excel.\n\nInstant digital download (.xlsx). Opens in Microsoft Excel or Google Sheets.",
    price: 14900,
    originalPrice: 49900,
    iconName: "Apple",
    color: "orange",
    features: [
      "Meal planning templates",
      "Calorie & macro calculator",
      "Grocery list generator",
      "Water intake tracker",
      "Weekly nutrition charts",
      "Diet comparison dashboard",
    ],
  },
  {
    name: "Body Measurement Tracker",
    shortName: "Body Tracker",
    slug: "body-measurement-tracker",
    description:
      "Track every body measurement over time — weight, waist, chest, arms, thighs and more. Watch your transformation with auto-generated charts.\n\nInstant digital download (.xlsx). Opens in Microsoft Excel or Google Sheets.",
    price: 14900,
    originalPrice: 29900,
    iconName: "Ruler",
    color: "pink",
    features: [
      "12+ body measurements",
      "Progress photo log",
      "BMI & body fat calculator",
      "Before/after comparison",
      "Monthly progress charts",
      "Goal setting dashboard",
    ],
  },
];

async function seedCatalog() {
  for (const product of PRODUCTS) {
    const fields = {
      name: product.name,
      shortName: product.shortName,
      description: product.description,
      price: product.price,
      originalPrice: product.originalPrice,
      badge: product.badge ?? null,
      iconName: product.iconName,
      color: product.color,
      isActive: true,
    };

    // Products are managed in Admin → Products; this only creates missing ones
    // so a re-seed never overwrites edits, images or which products are listed.
    const existing = await db.orm.public.Product.first({ slug: product.slug });
    if (existing) {
      console.log(`Skipped "${product.name}" (already exists).`);
      continue;
    }

    const created = await db.orm.public.Product.create({ ...fields, slug: product.slug });
    for (const [position, label] of product.features.entries()) {
      await db.orm.public.ProductFeature.create({ productId: created.id, label, position });
    }
    console.log(`Created product "${product.name}" — add its images in Admin → Products.`);
  }
}

async function main() {
  await seedAdmin();
  await seedCatalog();
  console.log("\nDone.");
  console.log(`Admin login — email: ${ADMIN_EMAIL}  password: ${ADMIN_PASSWORD}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => {
    process.exit(process.exitCode ?? 0);
  });
