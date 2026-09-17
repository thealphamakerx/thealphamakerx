export const siteConfig = {
  name: process.env.NEXT_PUBLIC_SITE_NAME ?? "The Alpha Maker X",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  description:
    "Kerala's #1 confidence and self-development coaching for men — practical, no-fluff digital guides on dating, fitness, and relationships, delivered instantly.",
  contactEmail: "thealphamakerx@gmail.com",
  contactPhone: "+91 79946 55929",
  // Same number in wa.me form (digits only, no +, no spaces).
  whatsappUrl: "https://wa.me/917994655929",
  location: "Kochi, Kerala, India",

  // Seller identity published on the legal pages. Razorpay's merchant terms
  // and the Consumer Protection (E-Commerce) Rules, 2020 both require a legal
  // name, a working phone number and a real postal address to be reachable on
  // the site. `addressLines` is still a PLACEHOLDER — it needs the full
  // registered address (street and PIN code) before taking live payments.
  legalName: process.env.NEXT_PUBLIC_LEGAL_NAME ?? "The Alpha Maker X",
  addressLines: ["Kochi, Kerala, India"],
  // Set once the business is GST-registered; hidden from the legal pages when empty.
  gstin: process.env.NEXT_PUBLIC_GSTIN ?? "",
  instagramUrl: "https://instagram.com/thealphamakerx",
  youtubeUrl: "https://youtube.com/@thealphamakerx",

  eyebrow: "Kerala's #1 Confidence Coach for Men",
  heroHeadline: "Become the Most Confident Version of Yourself",
  heroSubheadline:
    "On a mission to help 1,000,000 men build unshakable confidence, real discipline, and the life, body, and relationships they actually want — one honest, practical guide at a time.",
};
