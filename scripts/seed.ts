// One-off dev seed script. Run with: node scripts/seed.ts
// Requires DATABASE_URL / DATABASE_URL_UNPOOLED / BETTER_AUTH_SECRET etc.
// already set (loads .env.local via dotenv, same as the app).
import "dotenv/config";
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

// Real catalog copy. Edit digitalAccessUrl / upload the real file from the
// admin Products page once the actual PDFs exist in R2.
type SeedProduct = {
  name: string;
  slug: string;
  description: string;
  price: number; // paise
  badge: string;
  ratingOverride: number;
  reviewCountOverride: number;
  imageSeed: string;
};

const PRODUCTS: SeedProduct[] = [
  {
    name: "The Confidence Code: Master Attraction & Dating as a Man",
    slug: "confidence-dating-guide",
    description:
      "A practical, step-by-step guide to building real confidence — the kind that shows up in how you carry yourself, how you talk to people, and how you approach dating and relationships.\n\nInside you'll learn:\n- How to break the habits that keep you stuck in your head and overthinking\n- How to start conversations, hold eye contact, and speak with authority\n- How to plan and lead a first date that actually feels good for both people\n- How to read signals honestly and respect boundaries while still being direct about what you want\n- A 30-day action plan to practice everything, not just read about it\n\nInstant digital download (PDF). Works on phone, tablet, or laptop — no app required.\n\nകൂടുതൽ ആത്മവിശ്വാസത്തോടെ ജീവിക്കാൻ ഇന്ന് തന്നെ ആരംഭിക്കൂ.",
    price: 99900,
    badge: "#1 BEST SELLER",
    ratingOverride: 5,
    reviewCountOverride: 995,
    imageSeed: "product-1",
  },
  {
    name: "The Alpha Body Blueprint: Fitness, Nutrition & Energy for Men",
    slug: "wellness-fitness-guide",
    description:
      "A no-nonsense fitness and nutrition system built for men who want results without living in the gym or following fad diets.\n\nInside you'll learn:\n- A simple strength-training split you can run with just a gym or minimal home equipment\n- How to eat for muscle, energy, and fat loss on an Indian diet — with sample meal plans\n- Sleep, stress, and recovery habits that actually move the needle\n- How to build a routine you can sustain for years, not just for 30 days\n\nInstant digital download (PDF). Includes printable workout and meal-plan trackers.",
    price: 79900,
    badge: "#1 BEST SELLER",
    ratingOverride: 5,
    reviewCountOverride: 412,
    imageSeed: "product-2",
  },
  {
    name: "The Relationship Mastery Guide: Build Deep, Lasting Connections",
    slug: "relationship-skills-guide",
    description:
      "A guide to building relationships that last — rooted in honesty, communication, and mutual respect, not games or manipulation.\n\nInside you'll learn:\n- How to communicate needs and boundaries clearly, without conflict spiraling\n- How to build trust and emotional intimacy over time\n- How to handle disagreements like a team instead of opponents\n- How to keep growing together instead of drifting apart\n\nInstant digital download (PDF).",
    price: 89900,
    badge: "#1 BEST SELLER",
    ratingOverride: 5,
    reviewCountOverride: 765,
    imageSeed: "product-3",
  },
];

async function seedCatalog() {
  const existingProducts = await db.orm.public.Product.aggregate((a) => ({ count: a.count() }));
  if (existingProducts.count > 0) {
    console.log(`Catalog already has ${existingProducts.count} product(s) — skipping catalog seed.`);
    return;
  }

  for (const product of PRODUCTS) {
    const productRow = await db.orm.public.Product.create({
      name: product.name,
      slug: product.slug,
      description: product.description,
      price: product.price,
      badge: product.badge,
      ratingOverride: product.ratingOverride,
      reviewCountOverride: product.reviewCountOverride,
    });

    await db.orm.public.ProductImage.create({
      productId: productRow.id,
      url: `https://picsum.photos/seed/${product.imageSeed}/800/1000`,
      alt: product.name,
    });

    console.log(`Seeded product "${product.name}".`);
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
