export const siteConfig = {
  name: process.env.NEXT_PUBLIC_SITE_NAME ?? "The Alpha Maker X",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://thealphamakerx.in",
  description:
    "Straight-talking guides for men on dating, attraction and understanding women — practical, no-fluff ebooks delivered instantly.",
  contactEmail: "thealphamakerx@gmail.com",
  location: "Kochi, Kerala, India",
  // Meta (Facebook/Instagram) Pixel. Set NEXT_PUBLIC_META_PIXEL_ID="" to turn it off.
  metaPixelId: process.env.NEXT_PUBLIC_META_PIXEL_ID ?? "1787627140035737",

  // Seller identity published on the legal pages.
  legalName: process.env.NEXT_PUBLIC_LEGAL_NAME ?? "The Alpha Maker X",
  addressLines: ["Kochi, Kerala, India"],
  // Set once the business is GST-registered; hidden from the legal pages when empty.
  gstin: process.env.NEXT_PUBLIC_GSTIN ?? "",
  instagramUrl: "https://instagram.com/thealphamakerx",
  youtubeUrl: "https://youtube.com/@thealphamakerx",

  eyebrow: "Dating & attraction guides for men",
  heroHeadline: "Stop Guessing. Start Understanding Women.",
  heroSubheadline:
    "Practical, no-fluff guides on dating, attraction and relationships — the things most men are never taught, written for real men, not models or millionaires.",
};
