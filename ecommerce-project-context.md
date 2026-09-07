# E-Commerce & Landing Page Project Context

**Projects covered:**
- `attractwomen.me` — Landing page(s) only
- `thealphamakerx.in` — Full e-commerce platform, including admin panel

---

## 1. Project Vision

This is not a simple product landing page project. `thealphamakerx.in` should be built as a complete **e-commerce platform** using **Next.js + TypeScript**, with a customer storefront, secure admin panel, Razorpay payments, order processing, inventory, users, analytics, and operational management.

`attractwomen.me` is scoped narrower — landing pages only (no admin, no commerce backend needed unless specified later).

The site should feel like a **premium D2C brand**, not a generic Shopify-style store. The experience should communicate:

**Trust → Desire → Product Value → Proof → Easy Purchase → Post-purchase confidence**

Visual direction:
- Premium, modern, clean
- Conversion-focused, mobile-first, fast
- Strong typography, large product photography
- Subtle animations, clear CTAs
- Excellent checkout experience

Two major systems:
- **Customer Platform** — the public-facing shopping experience (applies to both domains)
- **Admin Platform** — secure dashboard for managing the entire business (`thealphamakerx.in` only)

---

## 2. Technology Architecture

### Frontend
- **Next.js** (App Router), TypeScript
- Server Components where appropriate, Client Components only where interaction is required
- SEO metadata, dynamic product/category pages, sitemap, robots.txt, structured data

### UI
- Tailwind CSS
- shadcn/ui or equivalent component system
- Lucide icons
- Framer Motion for restrained animations

### Backend (thealphamakerx.in)
```
Next.js App
│
├── Storefront
├── Authentication
├── API Routes / Server Actions
├── Admin Dashboard
├── Payment Integration
├── Order Management
├── Inventory
├── Customer Management
├── Notifications
└── Analytics
```

### Database
**PostgreSQL + Prisma**

Core entities:
```
User, Address, Product, ProductVariant, Category, ProductImage,
Inventory, Cart, CartItem, Order, OrderItem, Payment, Coupon,
Review, Wishlist, Notification, AdminUser, AdminRole, AuditLog
```

---

## 3. Site Information Architecture

Main navigation:
```
Home, Shop, Categories, Best Sellers, New Arrivals,
About, Contact, Track Order, Account, Cart
```

Optional additions:
```
Collections, Bundles, Offers, FAQ, Reviews, Journal / Blog
```

---

## 4. Homepage Structure

1. **Announcement Bar** — small top strip (admin-editable), e.g. "Free Shipping on Orders Above ₹999"
2. **Header** — sticky after scroll; desktop nav + mobile hamburger/cart
3. **Hero** — eyebrow text, headline, supporting copy, primary + secondary CTA, large product/lifestyle visual
4. **Trust Bar** — Premium Quality / Secure Payments / Fast Delivery / Easy Returns
5. **Featured Products** — bestseller cards with image, badge, name, rating, price, discount, quick add, wishlist, variant selector
6. **Brand Value Proposition** — "Made With Purpose" + 3–4 benefit blocks
7. **Product Showcase** — editorial split layout (image + copy + CTA)
8. **Why Customers Choose Us** — numbered feature grid (CMS-editable)
9. **Lifestyle/Product Gallery** — mixed lifestyle, product, detail, usage, packaging shots
10. **Social Proof** — rating summary + review cards
11. **Video/Brand Story** — full-width cinematic section
12. **Offers/Bundles** — single / pack-of-2 / pack-of-3 style pricing cards
13. **FAQ** — admin-manageable accordion
14. **Final CTA** — large closing conversion section
15. **Footer** — Shop, Help, Company, Follow, Newsletter columns

---

## 5. Shop Page

- Header with product count
- Filters: Categories, Price, Availability, Rating, Size, Color, Material, Collection
- Mobile: combined "Filters & Sort" control
- Sort: Featured, Newest, Price ↑/↓, Best Selling, Highest Rated

---

## 6. Product Detail Page

Layout: gallery (left) + product info (right) — badge, name, rating, price/compare-price/discount, description, variants, quantity, Add to Cart / Buy Now, trust icons.

Below the fold:
- Product Story
- Key Benefits (icon grid)
- Specifications (table)
- What's Included
- How To Use (steps)
- Reviews (filterable by star rating)
- Related Products

---

## 7. Cart

```
Product | Quantity | Price
Subtotal / Discount / Shipping / Total
[ Proceed to Checkout ]
```
Free-shipping progress bar upsell (e.g. "You're ₹250 away from FREE SHIPPING").

---

## 8. Checkout Flow

1. Contact info (phone, email)
2. Shipping address (name, phone, address, apartment, city, state, PIN)
3. Delivery method selection
4. Payment: UPI, Card, Net Banking, Wallets, COD
5. Order summary → **Pay Securely**

---

## 9. Razorpay Integration

Server-controlled payment flow:
```
Customer → Checkout → Create Order → Backend creates Razorpay Order
→ Razorpay Checkout → Customer Payment → Razorpay Response
→ Backend Signature Verification → Webhook Verification
→ Payment Status Updated → Order Confirmed
```

Payment states: `Pending, Processing, Successful, Failed, Refunded, Partially Refunded`

**Never trust only the frontend payment response** — backend must verify Razorpay signatures and process webhooks.

---

## 10. Order Management

Order statuses:
```
Pending → Confirmed → Processing → Packed → Shipped
→ Out for Delivery → Delivered
Cancelled / Returned / Refund Requested / Refunded
```

Order detail view includes customer info, items, payment, shipping, timeline, internal notes, and actions (Confirm, Pack, Mark Shipped, Add Tracking, Cancel, Refund).

---

## 11. Admin Dashboard (thealphamakerx.in)

Sidebar:
```
Dashboard
Orders / Products / Categories / Inventory / Customers / Reviews
Coupons / Payments / Shipping / Analytics
Content (Homepage, Banners, FAQs, Testimonials, Pages)
Settings (Users & Roles, Store, Payments, Shipping, Notifications, Audit Logs)
```

### Dashboard Home Metrics
- Today's Sales, Orders, Customers, Conversion Rate
- Revenue chart (Today / 7d / 30d / 3mo / 1yr)
- Orders chart
- Best Sellers table
- Recent Orders table

---

## 12. Product Management

Fields: Name, Slug, SKU, Category, Description, Short Description, Price, Compare-at Price, Cost Price, Tax, Images, Videos, Variants, Inventory, Weight, Dimensions, SEO Title/Description, Tags, Status.

Status values: `Draft, Active, Archived, Out of Stock`

---

## 13. Inventory Management

Tracked fields: Current Stock, Reserved Stock, Available Stock, Low Stock Threshold, Incoming Stock.

```
Available Stock = Current Stock - Reserved Stock
```

History log: Stock Added, Sold, Adjusted, Returned, Damaged.

---

## 14. Customer Management

Admin view: Name, Email, Phone, Orders, Total Spent, Last Order, Account Created, Status.

Customer profile: order history, addresses, wishlist, reviews, total spent, average order value.

---

## 15. Authentication

**Customer:** Email/Phone + Password, OTP, Google login (NextAuth/Auth.js)

**Admin:** Login + 2FA + role-based permissions (stronger than customer auth)

---

## 16. Roles & Permissions

Roles: `Super Admin, Admin, Operations, Marketing, Support`

Example permission keys:
```
products.read / products.create / products.update / products.delete
orders.read / orders.update / orders.refund
customers.read
analytics.read
```

---

## 17. Coupon System

Fields: Code, Discount Type (%/fixed), Minimum Order, Maximum Discount, Start/Expiry Date, Usage Limit, Per-Customer Limit, Applicable Products/Categories.

Examples: `WELCOME10`, `SAVE20`, `FIRSTORDER`

---

## 18. Shipping System

Config: Free Shipping Threshold, Standard/Express Fees, COD Fee, Delivery Regions, Estimated Delivery.

Order-level: Courier, Tracking Number, Shipping Provider, Tracking URL.

---

## 19. Reviews System

Customers can review only after purchase. Fields: Rating, Title, Description, Images, Verified Purchase.

Moderation states: `Pending, Approved, Rejected`

---

## 20. Wishlist

Add/remove product, move to cart. Persists across login sessions.

---

## 21. Notifications & Transactional Emails

**Customer events:** Order Confirmed, Payment Successful, Order Shipped, Order Delivered, Refund Processed

**Admin events:** New Order, Payment Failed, Low Stock, Refund Request, New Review

**Email templates:** Welcome, Order Confirmation, Payment Confirmation, Processing, Shipped, Out for Delivery, Delivered, Cancellation, Refund Confirmation, Password Reset

(Provider integrated later — e.g. Resend/SES/SendGrid)

---

## 22. SEO System

Per product: SEO Title, SEO Description, Canonical URL, OG Image, Schema (Product, Brand, Price, Currency, Availability, Reviews, Rating).

Auto-generate `/sitemap.xml` and `/robots.txt`.

---

## 23. Analytics

Metrics: Revenue, Orders, Customers, AOV, Conversion Rate, Repeat Customer Rate, Refund Rate, Top Products, Top Categories.

Funnel tracking: Visitors → Product Views → Add to Cart → Checkout Started → Purchases.

---

## 24. Security Architecture

Backend must validate: Authentication, Authorization, Input Validation, Payment Verification, Webhook Verification, Rate Limiting, CSRF (where applicable), XSS protection, SQL Injection protection.

Secrets that must remain server-side only:
```
RAZORPAY_KEY_SECRET
DATABASE_URL
AUTH_SECRET
SMTP_SECRET
```

---

## 25. Database Architecture (High-Level)

```
User
 ├── Addresses
 ├── Orders
 ├── Reviews
 ├── Wishlist
 └── Cart → CartItems → Product

Product
 ├── Category
 ├── Variants
 ├── Images
 ├── Inventory
 └── Reviews

Order
 ├── OrderItems
 ├── Payment
 ├── Shipment
 └── AddressSnapshot
```

**Key design decision:** Orders store snapshots (productName, SKU, unitPrice, quantity, discount, tax, finalPrice) rather than referencing live product data — historical orders stay accurate even after products change.

---

## 26. Suggested Project Structure

```
src/
├── app/
│   ├── (store)/
│   │   ├── page.tsx
│   │   ├── shop/ products/ categories/ cart/ checkout/ account/ orders/
│   ├── admin/
│   │   ├── dashboard/ orders/ products/ inventory/ customers/
│   │   ├── reviews/ coupons/ analytics/ content/ settings/
│   ├── api/
│   │   ├── payments/ razorpay/ webhooks/ orders/ upload/
│   └── auth/
├── components/
│   ├── ui/ storefront/ product/ cart/ checkout/ admin/ shared/
├── lib/
│   ├── db.ts auth.ts razorpay.ts payments.ts orders.ts
│   ├── inventory.ts pricing.ts shipping.ts email.ts validations/
├── prisma/schema.prisma
├── hooks/ types/ constants/ config/
```

---

## 27. Design System

Avoid: "purple gradient + huge rounded cards + random shadows." Use a premium, editorial design language.

### Base Palette
```
Background       #F8F7F4
Primary Text     #171717
Secondary Text   #6B6B6B
Primary Accent   #111111
Soft Surface     #EFEDE8
Border           #E3E0D9
Success          #27804A
Error            #C63C3C
```

Choose one brand accent based on the actual product. Possible directions:
- **Luxury** — Charcoal, Warm White, Champagne, Muted Gold
- **Modern** — Black, Off-white, Electric Blue
- **Natural** — Deep Green, Cream, Sand, Warm Brown
- **Bold D2C** — Near Black, White, Strong Brand Color

Accent used primarily for: CTA, active states, badges, key highlights — not everywhere.

### Typography
```
Heading: Manrope / Geist / Satoshi
Body: Inter / Geist

Headings: 56–72px desktop, 38–48px tablet, 32–40px mobile
```

### Animation Philosophy
Good: fade in, slide up, image hover, button micro-interactions, cart drawer, page transitions, skeleton loading.
Avoid: constant bouncing, heavy parallax, overly long transitions, animation on every element.

---

## 28. Mobile Experience

Product page order: Image → Title → Rating → Price → Benefits → Variants → Add to Cart → Buy Now.

Sticky bottom CTA bar with price + Buy Now button.

---

## 29. Admin UX Standards

Every major data table should support: Search, Filters, Sort, Pagination, Bulk Select, Bulk Actions, Export.

---

## 30. Content Management (CMS-lite)

Admin-editable homepage sections: Hero Banner, Announcement Bar, Featured Products, Collections, Testimonials, FAQs, Benefits, Promotional Banners, Footer Links — each with Section, Title, Description, Image, CTA Text, CTA URL, Display Order, Enabled toggle, reorderable.

---

## 31. Order & Payment State Machines

**Order:**
```
PENDING → CONFIRMED → PROCESSING → PACKED → SHIPPED → OUT_FOR_DELIVERY → DELIVERED
```
Returns: `DELIVERED → RETURN_REQUESTED → RETURN_APPROVED → RETURN_RECEIVED → REFUND_PROCESSING → REFUNDED`

**Payment:**
```
CREATED → PENDING → AUTHORIZED → CAPTURED  (or → FAILED)
Refund: CAPTURED → REFUND_REQUESTED → REFUNDED
```

---

## 32. Dashboard Business Intelligence

Surface actionable alerts, not just raw numbers:
- ⚠ Inventory Alert (low stock)
- ⚠ Payment Alert (failed payments today)
- 🔥 Best Seller (top revenue product this week)
- 📈 Growth (revenue trend vs. previous period)

---

## 33. Customer Account

```
My Account
├── Overview (recent order, status, total orders, saved items)
├── Orders
├── Wishlist
├── Addresses
└── Profile
```

Order tracking checklist UI: Confirmed → Processing → Packed → Shipped → Out for Delivery → Delivered.

---

## 34. Error & Loading States

- **Product not found** → "We couldn't find this product." + Continue Shopping
- **Empty cart** → "Your cart is waiting for something great." + Explore Products
- **Payment failed** → "Your payment didn't go through." + Try Again (cart stays intact)
- Skeleton loaders for: product cards, product page, orders, admin tables, dashboard stats

---

## 35. Search

**Storefront:** product name, SKU, category, tags.
**Admin:** order ID, customer name, phone, email, SKU.

---

## 36. Event Architecture

Centralized events triggering email, admin notification, and analytics:
```
order.created, payment.success, payment.failed, order.shipped,
order.delivered, refund.created, inventory.low, review.created
```

---

## 37. Audit Logs

Log every significant admin action: Product Created/Updated, Price Changed, Order Status Changed, Refund Created, Coupon Created, Admin Login, Settings Changed — with actor, before/after values, and timestamp.

---

## 38. Performance Targets

Fast initial load, optimized images (`next/image`), lazy loading, server rendering, minimal client JS, caching, database indexing, pagination.

---

## 39. Production Architecture

```
Customer → Next.js Storefront → { PostgreSQL, Razorpay, Storage }
                                        ↓
                                Business Logic
                                        ↓
                                Admin Dashboard
```

---

## 40. Core Modules Summary

```
STORE      : Home, Shop, Product, Categories, Cart, Checkout, Wishlist, Account, Order Tracking
COMMERCE   : Products, Variants, Pricing, Inventory, Coupons, Orders, Payments, Shipping, Returns, Refunds
CUSTOMERS  : Authentication, Profiles, Addresses, Orders, Reviews, Wishlist
ADMIN      : Dashboard, Orders, Products, Inventory, Customers, Reviews, Coupons,
             Analytics, Content, Users, Roles, Audit Logs
SYSTEM     : Auth, Authorization, Database, Payments, Webhooks, Notifications,
             File Storage, SEO, Analytics, Security, Logging
```

---

## 41. Brand Experience Goal

The customer should feel: **"This is a serious brand"** — not "a website someone made to sell one product."

That comes from: strong visual identity + excellent photography + storytelling + trust signals + frictionless checkout + polished interactions + solid operational backend.

The customer sees a beautiful storefront. The business owner gets a full operating system.

---

## 42. Master Project Brief (Prompt-Ready)

> Build a production-ready premium D2C e-commerce platform using Next.js, TypeScript, PostgreSQL, Prisma, Tailwind CSS and a modern component system.
>
> The platform must contain two complete experiences: (1) a premium customer-facing storefront, and (2) a secure admin/business management platform.
>
> The storefront should be conversion-focused, responsive, mobile-first, fast and visually premium. It must include a homepage, shop/catalog, categories, product detail pages, cart, checkout, customer authentication, account dashboard, wishlist, order tracking, reviews, FAQs, contact pages and SEO infrastructure.
>
> The homepage should be composed of editable sections including an announcement bar, premium hero section, featured products, best sellers, brand value propositions, product showcase, lifestyle gallery, testimonials, video/story section, bundles/offers, FAQs and final CTA — all manageable from the admin dashboard.
>
> Product pages should include high-quality image galleries, product information, pricing, discount comparison, ratings, reviews, variants, quantity controls, add-to-cart and buy-now functionality, benefits, specifications, what's included, usage info, FAQs and related products.
>
> The commerce system must include products, categories, variants, SKUs, pricing, inventory, stock tracking, coupons, cart, wishlist, orders, payments, shipping, returns, refunds and reviews.
>
> Integrate Razorpay for payments using a secure server-side architecture: orders created on the backend, payment responses verified server-side, and webhooks verified before updating payment/order state. Support successful, failed, and pending payments, refunds, and reconciliation.
>
> The order lifecycle must be: PENDING → CONFIRMED → PROCESSING → PACKED → SHIPPED → OUT_FOR_DELIVERY → DELIVERED, with cancellation, return requests, return approval, returned orders and refunds.
>
> Each order must preserve historical snapshots of shipping info, product name, SKU, quantity, pricing, discounts, tax and final price, independent of later product edits.
>
> The admin dashboard should provide dashboard metrics, revenue analytics, order analytics, product management, inventory management, customer management, review moderation, coupon management, content management, shipping/payment configuration, user/role management, notifications, audit logs and store settings — including revenue, orders, customers, AOV, conversion rate, repeat customer rate, refund rate, best sellers, recent orders, charts, and inventory/payment alerts.
>
> Implement RBAC with granular permissions (`products.read/create/update/delete`, `orders.read/update/refund`, `customers.read`, `analytics.read`) and roles: Super Admin, Admin, Operations, Marketing, Support.
>
> Implement coupons, shipping configuration, review management with moderation, transactional emails/notifications, a centralized commerce event architecture, full SEO infrastructure (metadata, canonical URLs, OG data, structured data, sitemap, robots.txt), storefront + admin search, and audit logging for all significant admin actions.
>
> Use a clean, premium, editorial design system — off-white/neutral background, near-black typography, subtle borders, one strong brand accent, large headlines, high-quality visuals, and restrained animation. Must be mobile-first with a sticky purchase CTA on product pages.
>
> Use Next.js Server Components where appropriate and Client Components only where interaction requires them. Keep all sensitive credentials (database, Razorpay, auth, email) server-side via environment variables.
>
> The final architecture should be scalable, maintainable, secure, SEO-friendly and production-ready — a complete premium e-commerce business platform, not a small storefront.

---

## 43. Next Steps to Decide

Pick a direction to develop next:

- **(A)** Full page-by-page UI/UX specification
- **(B)** Complete Prisma/database schema + API architecture
- **(C)** One master prompt for generating the entire Next.js project
