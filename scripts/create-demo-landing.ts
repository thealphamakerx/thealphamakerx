// Create (or refresh) a demo landing page as an unpublished draft.
//
//   node scripts/create-demo-landing.ts                    # the "Confidence Code" product
//   node scripts/create-demo-landing.ts --product=<slug>   # a specific product
//   node scripts/create-demo-landing.ts --list             # show product slugs
//
// Idempotent: re-running rewrites the demo page's copy but keeps its slug,
// domain and published state. Testimonials, bonuses and the countdown are left
// empty on purpose — add real ones in Admin → Landing pages; empty sections are hidden.
import "./load-env.ts";
import { db } from "../src/prisma/db.ts";

const SLUG = "demo";

const content = {
  announcement: "Instant download · Lifetime access · Secure UPI & card checkout",
  offerEndsAt: null,
  eyebrow: "For men who are done being overlooked",
  headline: "Become the man she notices first",
  subheadline:
    "A practical, step-by-step guide to confidence, attraction and dating — built for men who want real results, not recycled pickup lines.",
  heroBullets: [
    "Start conversations without freezing up",
    "Keep her interested past the first few messages",
    "Build a calm, confident presence she can feel",
    "Stop overthinking every move you make",
  ],
  heroImageUrl: "",
  heroVideoUrl: "",
  ctaLabel: "Get instant access",

  painTitle: "Does any of this sound familiar?",
  painPoints: [
    "You see someone you like, and by the time you think of what to say, the moment is gone",
    "Your chats start well and then quietly die after a few messages",
    "You keep ending up as “just a friend” with the people you actually like",
    "You overthink every text and still don't know if you got it right",
    "Your friends seem to find this easy, and you don't understand what they do differently",
  ],

  forYouTitle: "This guide is for you if…",
  forYou: [
    "You're shy or introverted and tired of losing out to louder guys",
    "You're getting back into dating after a break or a breakup",
    "You have almost no experience and want to start the right way",
    "You want clear steps you can practise, not motivation videos",
    "You're ready to put in the work and change how you show up",
  ],

  insideTitle: "What you'll learn",
  inside: [
    { title: "The confidence foundation", description: "Where approach anxiety really comes from, and the daily habits that quiet it." },
    { title: "Starting conversations", description: "Simple, natural ways to open — in person and online — without scripts that sound fake." },
    { title: "Keeping the spark alive", description: "How to build attraction in conversation so it doesn't fizzle out." },
    { title: "Texting that works", description: "What to send, when to send it, and how to move from chat to a real meeting." },
    { title: "Body language and presence", description: "Posture, eye contact and voice — the signals people read before you say a word." },
    { title: "Handling rejection", description: "How to stay composed, learn from it and keep going." },
  ],

  bonusesTitle: "",
  bonuses: [],

  testimonialsTitle: "What readers say",
  testimonials: [],

  guaranteeTitle: "Instant, lifetime access",
  guaranteeText:
    "Pay once and your guide unlocks the moment payment is confirmed. Your download link is emailed to you, and every purchase stays available on the My Orders page — no account needed.",

  faqs: [
    { question: "How do I get the guide after paying?", answer: "It unlocks on the confirmation page as soon as your payment is confirmed, and the download link is emailed to you too." },
    { question: "I have almost no experience. Is this for me?", answer: "Yes. It starts from the basics — confidence and starting conversations — and builds step by step." },
    { question: "Do I need to create an account?", answer: "No. You check out with your email, and can find your purchase any time under My Orders." },
    { question: "How can I pay?", answer: "UPI, debit and credit cards, and net banking, through Cashfree's secure checkout." },
    { question: "Is my purchase private?", answer: "Yes. The download is sent only to the email you enter at checkout." },
  ],

  closingTitle: "The best time to start was years ago. The next best is today.",
  closingText:
    "Every week you wait is another week of the same results. Get the guide, practise one chapter at a time, and see what changes.",

  offerIds: [],
  addOnProductIds: [],
};

const productArg = process.argv.find((a) => a.startsWith("--product="))?.split("=")[1];
const products = await db.orm.public.Product.orderBy((p) => p.createdAt.asc()).all();

if (process.argv.includes("--list")) {
  for (const p of products) console.log(`${p.isActive ? "active " : "retired"}\t${p.slug}\t${p.name}`);
  process.exit(0);
}
const product = productArg
  ? products.find((p) => p.slug === productArg)
  : products.find((p) => /confidence code/i.test(p.name));

if (!product) {
  console.error(productArg ? `No product with slug "${productArg}".` : 'No "Confidence Code" product — pass --product=<slug> (see --list).');
  process.exit(1);
}
if (!product.isActive) {
  console.warn(`Note: "${product.name}" is retired. The page previews fine, but checkout only sells active products — reactivate it in Admin → Products before publishing.`);
}

const existing = await db.orm.public.LandingPage.first({ slug: SLUG });
if (existing) {
  await db.orm.public.LandingPage.where({ id: existing.id }).update({ productId: product.id, content: JSON.stringify(content) });
  console.log(`Updated demo landing page for "${product.name}" (still ${existing.isActive ? "published" : "a draft"}).`);
} else {
  await db.orm.public.LandingPage.create({
    slug: SLUG,
    name: `Demo — ${product.name}`,
    productId: product.id,
    isActive: false,
    content: JSON.stringify(content),
  });
  console.log(`Created demo landing page for "${product.name}" as an unpublished draft.`);
}
console.log("Edit it in Admin → Landing pages. Preview: /lp/demo (while signed in as admin).");
process.exit(0);
