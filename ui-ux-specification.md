# Page-by-Page UI/UX Specification

**Direction:** Modern, minimalistic, image-driven, easy to browse — designed to attract and hold attention visually first, sell second. Clean layouts, generous white space, big photography, short copy.

---

## 0. Design Foundations

### Color Palette — "Warm Minimal"
Attractive but calm; one bold accent color does all the work, everything else stays quiet so photography stands out.

```
Background (Base)     #FFF9F5   soft warm white
Surface / Cards        #FFFFFF   pure white
Text — Primary         #1A1A1A   near-black
Text — Secondary       #7A7A7A   warm gray
Border / Divider       #EFE7DE   soft sand line
Accent — Primary       #E4572E   warm coral/terracotta (CTA, highlights)
Accent — Soft          #FBEAE3   coral tint (badges, hover backgrounds)
Success                #2E8B57   confirmation states
Error                  #D64545   error/alerts
```

> Swap the accent color per brand — coral works for "attraction/lifestyle" positioning; keep the rest of the palette (base, text, borders) constant across both sites so components stay reusable.

### Typography
```
Headings : Manrope (Bold / SemiBold)
Body     : Inter (Regular / Medium)

H1: 48–64px   H2: 32–40px   H3: 22–26px
Body: 16–18px   Small: 13–14px
Line-height: 1.4–1.6 for body, 1.1–1.2 for headings
```

### Layout Rules
- Max content width: 1280px, generous side padding (24px mobile / 80px desktop)
- Grid: 12-column, 24px gutter
- Corner radius: 12–16px on cards/buttons (soft, modern — not overly rounded)
- Shadows: very soft, low-opacity (`0 8px 24px rgba(0,0,0,0.06)`) — never harsh
- Photography: full-bleed or large-format wherever possible; text overlays use gradient scrims, not solid boxes

### Core Components
- **Primary Button**: coral fill, white text, 14px radius, subtle scale-up on hover
- **Secondary Button**: transparent, coral border/text
- **Card**: white surface, 16px radius, soft shadow, image on top / content below
- **Badge**: coral-tint background, coral text, pill shape
- **Image Frame**: 4:5 or 1:1 for lifestyle shots, 16:9 for hero/banner

---

## 1. Homepage

**Goal:** Stop the scroll in 3 seconds, build desire immediately, image-first.

| Section | Layout | Notes |
|---|---|---|
| Announcement Bar | Full-width, 32px height, coral background, white text | Rotating 1-line message, dismissible |
| Header | Sticky, transparent over hero → solid white on scroll | Logo center or left, nav links, search icon, account, cart badge |
| Hero | Full-bleed image/video, 80–90vh | Left-aligned text block over gradient scrim; H1 + 1-line subtext + 1 primary CTA |
| Trust Strip | Thin horizontal band, 4 icons in a row | Minimal icon + 3-word label each |
| Featured Grid | 2–3 column image-forward product cards | Large photo (75% of card), name + price only — no clutter |
| Brand Story Split | 50/50 image + text, alternating sides on scroll | Big lifestyle photo, short 2–3 sentence copy, no bullet lists |
| Testimonials | Horizontal auto-scroll carousel of cards | Photo/avatar + 1–2 line quote + star rating + name; swipeable on mobile |
| Gallery / Instagram-style Grid | 4–6 image tiles, square crop, tight gutters | Pure visual, optional tap-to-shop tags |
| Offers/Bundles | 3-card row, one highlighted as "Most Popular" | Big price, small strike-through price, 1 CTA |
| FAQ | Simple accordion, centered, max 600px width | 5–6 Q&As, plus-icon rotate on open |
| Final CTA | Full-width image background, centered short headline + button | High contrast, no distractions |
| Footer | 4-column minimal | Logo + 1-line tagline, Shop, Help, Company, socials + newsletter input |

**Attraction principles applied here:**
- Photography-to-text ratio should feel like ~70/30
- No more than one CTA color (coral) anywhere on the page
- Every section fits one scroll "beat" — don't cram two ideas per section

---

## 2. About Page

**Goal:** Build trust and emotional connection through story + faces, not paragraphs.

| Section | Layout | Notes |
|---|---|---|
| Intro Hero | Large single photo (founder/team/product in use) + short headline | 1 sentence mission statement, no long intro paragraph |
| Our Story | Alternating image/text blocks (2–3 blocks) | Each block: 1 photo + 3–4 sentence story beat |
| Values Grid | 3–4 column, icon + short label + 1 line | Minimal, no long explanations |
| Behind the Scenes | Full-width image strip or short video | Optional — humanizes the brand |
| Testimonials Repeat | Same carousel component as homepage | Reinforces trust again before nav-away |
| CTA Band | "Ready to try it yourself?" + button | Consistent close pattern across pages |

---

## 3. Testimonials / Reviews Page (standalone, if needed)

| Section | Layout | Notes |
|---|---|---|
| Header | Big stat callout: "4.9★ from 1,000+ customers" | Centered, large numerals |
| Filter Bar | Star filter chips (All / 5★ / 4★ / etc.) | Pill buttons, coral when active |
| Review Grid | Masonry or 2–3 column cards | Each: avatar/initial, name, verified badge, star rating, short quote, optional photo upload from customer |
| Load More | Simple button, no infinite scroll clutter | Keeps page lightweight |

---

## 4. Shop / Catalog Page

| Section | Layout | Notes |
|---|---|---|
| Page Header | Title + result count, minimal | "Shop All" + "126 products" |
| Filter Bar | Horizontal chip filters (desktop) / bottom-sheet (mobile) | Category, price, rating — icons kept minimal |
| Sort Dropdown | Top-right, simple select | Featured / Price / Rating / Newest |
| Product Grid | 3–4 column desktop, 2 column mobile | Square/portrait image dominant, name + price small below, quick-add icon on hover |
| Empty State | Centered illustration + "No products match" + reset filters button | |
| Pagination | Simple numbered or "Load More" | Avoid dense pagination UI |

---

## 5. Product Detail Page

| Section | Layout | Notes |
|---|---|---|
| Gallery | Left 55–60%, large image + thumbnail strip below/side; pinch-zoom on mobile | Image is hero of the page |
| Product Info | Right 40–45%: badge, name, rating row, price/compare price, short 1-line description | Keep initial view short — expand below |
| Variant/Qty | Pill-style variant selector, stepper for quantity | Touch-friendly, 44px min tap targets |
| CTAs | Add to Cart (secondary) + Buy Now (primary, coral) stacked or side-by-side | Sticky on mobile scroll |
| Trust Row | 3 small icons: secure payment / fast delivery / easy returns | Directly under CTA |
| Expandable Details | Accordion: Description, Specifications, What's Included, How to Use | Keeps page uncluttered, image stays focal point |
| Reviews | Star breakdown bar chart + filterable review cards + photo reviews | Encourage image-based reviews for more "attraction" content |
| Related Products | Horizontal scroll carousel, image-forward cards | "You may also like" |
| Sticky Mobile Bar | Price + Buy Now, appears after scrolling past main CTA | |

---

## 6. Cart (Drawer or Page)

| Section | Layout | Notes |
|---|---|---|
| Cart Drawer | Slide-in from right, 400–480px wide | Line items with thumbnail, name, variant, qty stepper, price |
| Upsell Bar | Progress bar toward free shipping | Coral fill bar on sand track |
| Summary | Subtotal, discount, shipping, total — right aligned numbers | |
| CTA | Full-width "Proceed to Checkout" button | Sticky at drawer bottom |
| Empty State | Simple illustration/image + "Your cart is empty" + Shop Now button | |

---

## 7. Checkout

| Step | Layout | Notes |
|---|---|---|
| Progress Indicator | Thin top stepper: Info → Shipping → Payment | Minimal, no heavy numbering circles |
| Contact & Shipping | Single-column form, generous field spacing, floating labels | Auto-save on blur |
| Delivery Options | Radio cards with price + ETA | |
| Payment | Tabbed: UPI / Card / Netbanking / Wallet / COD | Razorpay elements styled to match palette |
| Order Summary | Collapsible on mobile, sticky sidebar on desktop | Line items thumbnail + totals |
| Confirmation | Full-page success state with order number, big checkmark illustration, delivery estimate | Encourage social share or "leave a review later" nudge |

---

## 8. Account Dashboard (Customer)

| Section | Layout | Notes |
|---|---|---|
| Overview | Card grid: recent order status, quick links (Orders, Wishlist, Addresses, Profile) | Minimal icons, big tap targets |
| Orders List | Card per order: thumbnail(s), status pill (color-coded), total, "View Details" | |
| Order Detail | Vertical timeline (Confirmed → Shipped → Delivered) with icons | Visual progress, not just text |
| Wishlist | Same product-card component as shop grid | |
| Addresses | Simple card list + "Add New" | |
| Profile | Basic form: name, email, phone, password change | |

---

## 9. Contact / Support Page

| Section | Layout | Notes |
|---|---|---|
| Split Layout | Left: contact form (name, email, message) | Right: map/image or support hours + social links |
| FAQ Shortcut | "Looking for something else? Check our FAQ" link | Reduces support load |

---

## 10. Landing Pages (attractwomen.me — dedicated single-purpose pages)

These are standalone, high-conversion pages — no site-wide nav clutter, single goal per page.

| Section | Layout | Notes |
|---|---|---|
| Header | Logo only, no nav — keeps focus on the offer | Optional single CTA button top-right |
| Hero | Full-bleed image/video background, centered or left headline + 1 CTA | Attention-grabbing, image is 80%+ of viewport |
| Social Proof Strip | Small logos/stat row directly under hero | "As seen in", "10,000+ happy customers", etc. |
| Benefit Blocks | 3 alternating image/text sections, short punchy copy | One core benefit per block, large supporting photo |
| Testimonials | Full-width carousel, photo-forward cards | Real faces build trust fast |
| Offer/Pricing | Single focused card or 2–3 tier comparison | One obvious "best value" highlight |
| FAQ | Short accordion, 4–5 objection-handling questions | |
| Final CTA | Repeat hero-style close: big image + single button | Same CTA text as hero for consistency |
| Footer | Minimal — legal links + socials only | No distracting nav |

**Landing page principles:**
- One CTA action per page, repeated 3–4 times down the page
- No competing links away from the page (minimal/no header nav)
- Every section should be skimmable in under 5 seconds
- Mobile-first: assume most traffic arrives from social/ads

---

## 11. Admin Pages (thealphamakerx.in only)

Kept functional and clean — data density over decoration, but same soft/minimal visual language (white cards, sand borders, coral for primary actions/alerts).

| Page | Layout | Notes |
|---|---|---|
| Dashboard | KPI card row (4) + revenue chart + orders chart + best sellers table + recent orders table | Coral used only for alert badges |
| Orders List | Data table: search, filter chips, status pills, bulk actions bar | Status colors: gray (pending), blue (processing), green (delivered), red (cancelled) |
| Order Detail | Two-column: items/timeline left, customer/payment/shipping card right | |
| Products List | Table with thumbnail, name, stock, price, status toggle | Inline quick-edit where possible |
| Product Editor | Tabbed form: General / Pricing / Variants / Images / SEO | Image uploader drag-and-drop, large previews |
| Inventory | Table + low-stock alert banner at top | |
| Customers | Table + profile drawer on row click | |
| Reviews | Moderation queue: pending/approved/rejected tabs | |
| Content/CMS | Drag-to-reorder list of homepage sections, each expandable to edit | |
| Settings | Simple tabbed form sections (Store, Payments, Shipping, Roles, Notifications) | |

---

## 12. Interaction & Motion Notes

- Page transitions: fade + slight upward slide (200–300ms)
- Image hover: subtle scale (1.03x) on product cards
- Cart drawer: slide-in 250ms ease-out
- Buttons: 120ms color/scale transition on hover/press
- Skeleton loaders (not spinners) for product grids, order tables, dashboard cards
- Micro-confirmation: small toast/snackbar (bottom-center) for "Added to cart", "Saved", etc.

---

## 13. Responsive Breakpoints

```
Mobile   : < 640px   — single column, sticky CTAs, bottom-sheet filters
Tablet   : 640–1024px — 2-column grids
Desktop  : > 1024px  — full multi-column layouts, sidebar filters
```

---

## Summary

- **attractwomen.me** → Section 10 (dedicated landing pages) is the primary spec to build from — image-heavy, single-CTA, testimonial-driven, no nav clutter.
- **thealphamakerx.in** → Sections 1–9 (full storefront) + Section 11 (admin) — same visual language, extended into a complete shopping experience.
- Both share the same color palette, typography, and component library (Section 0) so the two properties feel like one consistent brand.
