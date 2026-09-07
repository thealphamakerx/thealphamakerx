# thealphamakerx.in — Implementation Plan

Source specs: [`ecommerce-project-context.md`](./ecommerce-project-context.md) (product/architecture brief) and [`ui-ux-specification.md`](./ui-ux-specification.md) (page-by-page UI spec). This plan sequences the build from the current scaffold to production. Storefront/customer-facing work is specified in full; the admin panel is scoped at the module/page level only (rough pass) — detailed admin UX design is a later, separate effort.

---

## 1. Current State (already scaffolded)

- Next.js App Router project with the full route skeleton: `(store)` route group (home, shop, products/[slug], categories/[slug], cart, checkout, account/orders, account/wishlist, account/addresses, about, contact), `admin/*` (dashboard, orders, products, inventory, customers, reviews, coupons, analytics, content, settings), `api/*` (razorpay create-order + verify, razorpay webhook, orders, upload, NextAuth), and `auth/signin`.
- Data layer: **Prisma Next** (contract-first ORM, not classic Prisma Client) at `src/prisma/contract.prisma`, emitted to `contract.json`/`contract.d.ts`, runtime client at `src/prisma/db.ts` (re-exported via `src/lib/db.ts`). Models: `User`, `Category`, `Product`, `ProductVariant`, `ProductImage`, `Review`, `Address`, `Order`, `OrderItem` (with `Role` and `OrderStatus` enums).
- `src/lib/`: `razorpay.ts` (client + signature verify), `pricing.ts`, `shipping.ts`, `email.ts` (Resend), `inventory.ts`, `orders.ts`, `auth.ts` (NextAuth config, JWT sessions), `utils.ts`, `validations/` (zod).
- shadcn/ui primitives already present under `src/components/ui/`; `src/components/{storefront,product,cart,checkout,admin,shared}/` exist as empty directories awaiting components.
- Verified: `tsc --noEmit`, `eslint`, and `next build` all pass on the scaffold.

### Known gaps to resolve early (not deferred)

- **NextAuth adapter.** `@auth/prisma-adapter` expects the classic `@prisma/client` query surface (`db.user.findUnique`, …); this project's `db.ts` uses Prisma Next's `db.orm.public.<Model>` API instead. No adapter is wired yet — JWT sessions work without one, but OAuth account linking / database sessions need a **custom NextAuth Adapter** written against `db.orm.public.User/Account/Session`. Decide before building sign-in (Section 15 of the context doc: email/phone+password, OTP, Google).
- **Category hierarchy.** The context doc doesn't require nested categories; the current contract keeps `Category` flat (no parent/child). Add a self-relation later only if the catalog actually needs subcategories — confirm before modeling it, since Prisma Next's self-relation/back-reference syntax wasn't verified for this version.
- **Reverse relations.** This Prisma Next version does not auto-expose reverse relations on `.include()` — only the declared (owning-side) relation is queryable. Order → OrderItem, Product → ProductVariant/ProductImage/Review, User → Order/Address/Review, Category → Product are all one-directional in the ORM today. Query the "many" side directly with a `where` filter (as `getOrderById` already does) rather than assuming `.include('items')`-style eager loading works both ways.

---

## 2. Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js (App Router), TypeScript |
| Styling/UI | Tailwind CSS v4, shadcn/ui (`base-nova` style, base-ui primitives), Lucide icons, Framer Motion |
| Database | PostgreSQL via **Prisma Next** (contract-first: `contract.prisma` → `contract.json`/`contract.d.ts` → typed `db.orm` / `db.sql` client) |
| Auth | NextAuth (Auth.js v4) — JWT sessions now; custom Adapter if/when DB sessions or OAuth linking are needed |
| Payments | Razorpay — server-created orders, server-side signature verification, webhook-verified state transitions |
| Email | Resend |
| Forms/validation | react-hook-form + zod |

---

## 3. Data Model

Implemented in `src/prisma/contract.prisma`:

```
User (Role: CUSTOMER | ADMIN)
Category
Product → Category
ProductVariant → Product
ProductImage → Product
Review → Product, User
Address → User
Order → User, Address (OrderStatus enum)
OrderItem → Order, ProductVariant   (snapshot fields: productName, variantName, sku, unitPrice, finalPrice)
```

`OrderItem` intentionally snapshots product data at time of purchase (name, SKU, unit price, final price) per the context doc's design decision — historical orders must stay accurate even if the product is later edited or deleted.

**Not yet modeled** (add when the corresponding milestone starts, to avoid speculative schema): `Cart`/`CartItem` (cart can start client-side/localStorage and move server-side later), `Payment` (currently folded into `Order.razorpayOrderId`/`razorpayPaymentId`; split out if partial refunds / multiple payment attempts per order are needed), `Coupon`, `Wishlist`, `Notification`, `AdminRole`/permission tables, `AuditLog`. Section 25 of the context doc has the target shape for each.

---

## 4. Build Milestones

Each milestone should ship independently testable and buildable (`next build` green) before moving to the next.

### M1 — Authentication
- Decide the NextAuth provider set (email/password credentials, Google OAuth, OTP) and write the matching custom Adapter (or drop the adapter and manage `User`/`Address` rows directly from application code if OAuth isn't needed at launch).
- Wire `src/app/auth/signin` to a real sign-in form; add sign-up if credentials auth is used.
- Route guards: protect `(store)/account/*` for signed-in customers, `admin/*` for `Role: ADMIN`.

### M2 — Catalog & Storefront UI
Build out `src/components/storefront/`, `src/components/product/`, `src/components/shared/` and wire the already-scaffolded pages to real data via `db.orm.public.Product/Category/ProductVariant`:
- Homepage sections (UI spec §1): announcement bar, header, hero, trust strip, featured grid, brand story split, testimonials, gallery, offers/bundles, FAQ, final CTA, footer.
- Shop/catalog page (UI spec §4): filters, sort, product grid, empty state, pagination.
- Product detail page (UI spec §5): gallery, info panel, variant/qty selector, expandable details, reviews, related products, sticky mobile CTA.
- About, Contact, Testimonials pages (UI spec §2, §3, §9).

### M3 — Cart & Checkout
- Cart: client-side state via `useCart` hook (already scaffolded) → cart drawer (UI spec §6) with free-shipping progress bar (`src/lib/shipping.ts` already has the threshold logic).
- Checkout flow (UI spec §7 / context doc §8): contact → shipping address → delivery method → payment tabs → order summary. Persist `Address` on submit.
- Order creation: build the `Order` + `OrderItem` rows (with price snapshots) before handing off to payment.

### M4 — Razorpay Payment + Post-Purchase Delivery
This is the critical trust boundary — never trust the frontend payment response.

1. `POST /api/razorpay/create-order` — already scaffolded; creates the Razorpay order tied to the local `Order.id`.
2. Razorpay Checkout on the client (payment tabs: UPI, Card, Netbanking, Wallet, COD).
3. `POST /api/razorpay/verify` — already scaffolded; verifies the signature server-side before marking anything paid.
4. `POST /api/webhooks/razorpay` — already scaffolded; verifies the webhook signature and is the **source of truth** for payment state (the client-side verify call is a UX fast-path, not authoritative).
5. **Post-purchase delivery** (what the signed-in buyer sees/gets once payment is confirmed):
   - Order status flips `PENDING → CONFIRMED` on verified payment.
   - Confirmation page (UI spec §7 "Confirmation"): order number, success state, delivery estimate.
   - Transactional email via Resend (context doc §21): order confirmation + payment confirmation.
   - The order becomes visible in `(store)/account/orders` immediately — this *is* "getting the product": for a physical-goods store, delivery is fulfillment (Section 5 below), not a digital unlock. If a digital/downloadable SKU is ever added, gate its download link behind `Order.status >= CONFIRMED` and the signed-in `userId` matching `Order.userId`.
   - Emit the `order.created` / `payment.success` events (context doc §36) so notification + analytics consumers can hook in without touching the payment code path again.

### M5 — Order Management & Customer Account
- Order state machine (context doc §31): `PENDING → CONFIRMED → PROCESSING → PACKED → SHIPPED → OUT_FOR_DELIVERY → DELIVERED`, plus the return/refund branch.
- Account area (UI spec §8): overview, orders list + detail (timeline UI), wishlist, addresses, profile.
- Order tracking checklist component, reused in both customer account and admin order detail.

### M6 — Admin Panel (rough pass — high-level only)
Build the admin shell and each module to a functional-but-plain standard first; visual polish and the full admin UX spec (UI spec §11) is a later pass. One line per module for now:

| Page | Purpose |
|---|---|
| Dashboard | KPI cards (sales, orders, customers, conversion) + revenue/orders charts + best sellers + recent orders |
| Orders | Searchable/filterable table; detail view with items, payment, shipping, timeline, status actions |
| Products | CRUD + variants, images, SEO fields, status (Draft/Active/Archived/Out of Stock) |
| Inventory | Stock table + low-stock alerts; current/reserved/available stock |
| Customers | Table + profile drawer (orders, spend, addresses) |
| Reviews | Moderation queue (Pending/Approved/Rejected) |
| Coupons | CRUD for discount codes, usage limits, applicability |
| Analytics | Revenue/orders/customers/AOV/conversion/repeat-rate/refund-rate, top products/categories |
| Content | CMS-lite: reorderable homepage sections (hero, banners, testimonials, FAQs) |
| Settings | Store, payments, shipping, roles/users, notifications, audit logs |

RBAC (context doc §16): `Super Admin, Admin, Operations, Marketing, Support` roles with granular permission keys — implement as a permissions table/middleware once more than one admin role actually exists; don't build the full permission matrix speculatively.

### M7 — Coupons, Shipping, Reviews, Wishlist
- Coupon application logic in checkout (percentage/fixed, min order, max discount, usage limits).
- Shipping config surfaced from admin settings into `src/lib/shipping.ts` (currently hardcoded threshold/fee).
- Review submission gated to verified purchasers; moderation queue feeds the storefront review display.
- Wishlist persisted server-side once a `Wishlist` model exists (currently `useWishlist` is local-only).

### M8 — SEO, Analytics, Notifications, Hardening
- Per-product SEO fields → metadata API, sitemap.xml, robots.txt, structured data (Product/Review schema).
- Full transactional email set (context doc §21) beyond order confirmation.
- Audit log for admin actions (context doc §37).
- Security pass: rate limiting on auth + payment endpoints, input validation coverage audit, dependency review.
- Performance pass: image optimization, pagination on all list views, DB indexing review against actual query patterns.

---

## 5. Fulfillment Note (physical goods vs. "gets the product")

The context doc describes a physical D2C storefront (shipping, tracking, returns) — so "the purchaser gets the product" means **order fulfillment**, not a digital unlock: paid order → visible in account → shipped → delivered, with status/tracking visible throughout (M5). If a digital or licensed product line is added later, extend `Product`/`ProductVariant` with a `deliveryType: PHYSICAL | DIGITAL` field and add a guarded download/license endpoint that checks `Order.status` and `Order.userId` before serving the asset — don't build that gate now for a catalog that doesn't have digital SKUs yet.

---

## 6. Sequencing Rationale

Auth → Catalog → Cart/Checkout → Payment → Order/Account → Admin, because: nothing in the storefront needs real auth to *look* right (M2 can use mock/seeded data), but checkout and account pages need a real signed-in user; payment must exist before order status transitions mean anything; admin is last because every admin table is a view over data that only exists once M1–M5 are producing it. Coupons/reviews/wishlist (M7) and SEO/notifications/hardening (M8) are deliberately last — they enhance an already-functioning purchase path rather than gating it.
