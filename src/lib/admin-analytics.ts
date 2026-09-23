import { authPool as pool } from "@/lib/auth";

// Sales analytics for the admin. Every figure is bucketed on the IST calendar:
// the business runs in India, so "today" starts at IST midnight, not the
// server's. Revenue is net of refunds, counted on the day the order was placed.
//
// "Paid" means status PAID. A fully refunded order becomes REFUNDED and leaves
// revenue; a partial refund stays PAID and only its refunded part is deducted.

const LOCAL = `(o."createdAt" at time zone 'Asia/Kolkata')`;
const LOCAL_NOW = `(now() at time zone 'Asia/Kolkata')`;
const NET = `(o.total - o."refundedAmount")`;

const num = (v: unknown) => Number(v ?? 0);

/** Today in IST as YYYY-MM-DD. */
export function istToday(): string {
  return new Date(Date.now() + 5.5 * 3600e3).toISOString().slice(0, 10);
}

export function istDaysAgo(days: number): string {
  return new Date(Date.now() + 5.5 * 3600e3 - days * 864e5).toISOString().slice(0, 10);
}

export type Totals = { revenue: number; orders: number };

export type PeriodSummary = {
  key: "today" | "week" | "month" | "all";
  current: Totals;
  /** The previous period over the same elapsed time (e.g. yesterday up to this hour). */
  previous: Totals | null;
  /** IST calendar days covered so far, today included. */
  days: number;
};

/** Today / this week (from Monday) / this month / all time, each against its previous period. */
export async function getPeriodSummaries(): Promise<PeriodSummary[]> {
  const periods = [
    { key: "today", unit: "day" },
    { key: "week", unit: "week" },
    { key: "month", unit: "month" },
  ] as const;

  const select = periods
    .map(({ key, unit }) => {
      const start = `date_trunc('${unit}', ${LOCAL_NOW})`;
      const prevStart = `(${start} - interval '1 ${unit}')`;
      const prevEnd = `(${LOCAL_NOW} - interval '1 ${unit}')`;
      return `
        count(*) filter (where ${LOCAL} >= ${start}) as "${key}Orders",
        coalesce(sum(${NET}) filter (where ${LOCAL} >= ${start}), 0) as "${key}Revenue",
        count(*) filter (where ${LOCAL} >= ${prevStart} and ${LOCAL} < ${prevEnd}) as "${key}PrevOrders",
        coalesce(sum(${NET}) filter (where ${LOCAL} >= ${prevStart} and ${LOCAL} < ${prevEnd}), 0) as "${key}PrevRevenue",
        (${LOCAL_NOW}::date - ${start}::date + 1) as "${key}Days"`;
    })
    .join(",");

  const { rows: [row] } = await pool.query(`
    select ${select},
      count(*) as "allOrders",
      coalesce(sum(${NET}), 0) as "allRevenue",
      coalesce(${LOCAL_NOW}::date - min(${LOCAL})::date + 1, 1) as "allDays"
    from public."order" o
    where o.status = 'PAID'
  `);

  return [
    ...periods.map(({ key }) => ({
      key,
      current: { revenue: num(row[`${key}Revenue`]), orders: num(row[`${key}Orders`]) },
      previous: { revenue: num(row[`${key}PrevRevenue`]), orders: num(row[`${key}PrevOrders`]) },
      days: num(row[`${key}Days`]),
    })),
    {
      key: "all" as const,
      current: { revenue: num(row.allRevenue), orders: num(row.allOrders) },
      previous: null,
      days: num(row.allDays),
    },
  ];
}

export type DailyPoint = { day: string; revenue: number; orders: number };

export type DateRange = { from: string; to: string };

/** Paid revenue and orders per IST day across a range, zero-filled. */
export async function getDailySales({ from, to }: DateRange): Promise<DailyPoint[]> {
  const { rows } = await pool.query(`
    select to_char(d.day, 'YYYY-MM-DD') as day,
      count(o.id) as orders,
      coalesce(sum(${NET}), 0) as revenue
    from generate_series($1::date::timestamp, $2::date::timestamp, interval '1 day') as d(day)
    left join public."order" o
      on o.status = 'PAID' and ${LOCAL}::date = d.day::date
    group by d.day
    order by d.day
  `, [from, to]);
  return rows.map((r) => ({ day: r.day, revenue: num(r.revenue), orders: num(r.orders) }));
}

const RANGE = `${LOCAL}::date between $1::date and $2::date`;

/** Paid orders per IST hour of day within a range. */
export async function getHourlyOrders({ from, to }: DateRange): Promise<number[]> {
  const { rows } = await pool.query(`
    select extract(hour from ${LOCAL})::int as hour, count(*) as orders
    from public."order" o
    where o.status = 'PAID' and ${RANGE}
    group by 1
  `, [from, to]);
  const hours = Array<number>(24).fill(0);
  for (const r of rows) hours[r.hour] = num(r.orders);
  return hours;
}

/** Paid revenue and orders per weekday (0 = Monday) within a range, with how many of each weekday the range spans. */
export async function getWeekdaySales({ from, to }: DateRange) {
  const [{ rows }, { rows: spans }] = await Promise.all([
    pool.query(`
      select (extract(isodow from ${LOCAL})::int - 1) as dow, count(*) as orders, coalesce(sum(${NET}), 0) as revenue
      from public."order" o
      where o.status = 'PAID' and ${RANGE}
      group by 1
    `, [from, to]),
    pool.query(`
      select (extract(isodow from d)::int - 1) as dow, count(*) as days
      from generate_series($1::date::timestamp, $2::date::timestamp, interval '1 day') d
      group by 1
    `, [from, to]),
  ]);
  return Array.from({ length: 7 }, (_, dow) => {
    const r = rows.find((x) => x.dow === dow);
    const span = spans.find((x) => x.dow === dow);
    return { dow, revenue: num(r?.revenue), orders: num(r?.orders), days: num(span?.days) };
  });
}

export type RangeSummary = {
  revenue: number;
  orders: number;
  checkouts: number;
  reachedPayment: number;
  buyers: number;
  repeatBuyers: number;
  newBuyers: number;
  discount: number;
  refunded: number;
  refundedOrders: number;
  days: number;
};

export async function getRangeSummary({ from, to }: DateRange): Promise<RangeSummary> {
  const { rows: [r] } = await pool.query(`
    with ranged as (
      select o.* from public."order" o where ${RANGE}
    ),
    buyers as (
      select lower(email) as email, count(*) as orders from ranged
      where status = 'PAID' and email is not null group by 1
    )
    select
      coalesce(sum(o.total - o."refundedAmount") filter (where o.status = 'PAID'), 0) as revenue,
      count(*) filter (where o.status = 'PAID') as orders,
      count(*) as checkouts,
      count(*) filter (where o."paymentStatus" <> 'NOT_STARTED' or o.status <> 'PENDING') as "reachedPayment",
      coalesce(sum(o."discountAmount") filter (where o.status = 'PAID'), 0) as discount,
      coalesce(sum(o."refundedAmount"), 0) as refunded,
      count(*) filter (where o."refundedAmount" > 0) as "refundedOrders",
      (select count(*) from buyers) as buyers,
      (select count(*) from buyers where orders > 1) as "repeatBuyers",
      (select count(*) from buyers b where not exists (
        select 1 from public."order" p
        where p.status = 'PAID' and lower(p.email) = b.email
          and (p."createdAt" at time zone 'Asia/Kolkata')::date < $1::date
      )) as "newBuyers",
      ($2::date - $1::date + 1) as days
    from ranged o
  `, [from, to]);
  return {
    revenue: num(r.revenue), orders: num(r.orders), checkouts: num(r.checkouts),
    reachedPayment: num(r.reachedPayment), buyers: num(r.buyers), repeatBuyers: num(r.repeatBuyers),
    newBuyers: num(r.newBuyers), discount: num(r.discount), refunded: num(r.refunded),
    refundedOrders: num(r.refundedOrders), days: num(r.days),
  };
}

export type ProductPerformance = {
  productId: string;
  name: string;
  units: number;
  revenue: number;
  /** Paid orders that had this product together with at least one other. */
  withOthers: number;
};

export async function getProductPerformance({ from, to }: DateRange): Promise<ProductPerformance[]> {
  const { rows } = await pool.query(`
    select i."productId", max(i."productName") as name,
      count(*) as units,
      coalesce(sum(i."finalPrice"), 0) as revenue,
      count(*) filter (where (select count(*) from public."orderItem" x where x."orderId" = o.id) > 1) as "withOthers"
    from public."orderItem" i
    join public."order" o on o.id = i."orderId"
    where o.status = 'PAID' and ${RANGE}
    group by i."productId"
    order by revenue desc
  `, [from, to]);
  return rows.map((r) => ({
    productId: r.productId, name: r.name, units: num(r.units), revenue: num(r.revenue), withOthers: num(r.withOthers),
  }));
}

export async function getCouponPerformance({ from, to }: DateRange) {
  const { rows } = await pool.query(`
    select o."couponCode" as code, count(*) as orders,
      coalesce(sum(o."discountAmount"), 0) as discount,
      coalesce(sum(${NET}), 0) as revenue
    from public."order" o
    where o.status = 'PAID' and o."couponCode" is not null and ${RANGE}
    group by 1
    order by orders desc
    limit 20
  `, [from, to]);
  return rows.map((r) => ({ code: r.code as string, orders: num(r.orders), discount: num(r.discount), revenue: num(r.revenue) }));
}

export async function getTopBuyers({ from, to }: DateRange, limit = 10) {
  const { rows } = await pool.query(`
    select lower(o.email) as email, count(*) as orders, coalesce(sum(${NET}), 0) as spent,
      max(o."createdAt") as "lastOrderAt"
    from public."order" o
    where o.status = 'PAID' and o.email is not null and ${RANGE}
    group by 1
    order by spent desc, orders desc
    limit $3
  `, [from, to, limit]);
  return rows.map((r) => ({ email: r.email as string, orders: num(r.orders), spent: num(r.spent), lastOrderAt: new Date(r.lastOrderAt) }));
}

// ── Orders list ─────────────────────────────────────────────────────────────

const FAILED_PAYMENT = `('FAILED','USER_DROPPED','NOT_ATTEMPTED','EXPIRED','TERMINATED','TERMINATION_REQUESTED','CANCELLED','VOID')`;

/** Order list tabs. Each is a plain SQL predicate over `o`. */
export const ORDER_FILTERS = {
  all: { label: "All", where: "true" },
  paid: { label: "Paid", where: `o.status = 'PAID'` },
  awaiting: { label: "Awaiting payment", where: `o.status = 'PENDING' and o."paymentStatus" in ('ACTIVE','PENDING')` },
  failed: { label: "Payment failed", where: `o.status = 'PENDING' and o."paymentStatus" in ${FAILED_PAYMENT}` },
  abandoned: { label: "Not started", where: `o.status = 'PENDING' and o."paymentStatus" = 'NOT_STARTED'` },
  review: { label: "Needs review", where: `o."paymentStatus" = 'REVIEW_REQUIRED'` },
  refunded: { label: "Refunded", where: `(o.status = 'REFUNDED' or o."refundedAmount" > 0)` },
  cancelled: { label: "Cancelled", where: `o.status = 'CANCELLED'` },
} as const;

export type OrderFilter = keyof typeof ORDER_FILTERS;

export const isOrderFilter = (value: unknown): value is OrderFilter =>
  typeof value === "string" && value in ORDER_FILTERS;

export type OrderQuery = {
  status: OrderFilter;
  q?: string;
  from?: string;
  to?: string;
  productId?: string;
  coupon?: "with" | "without";
  /** Landing page slug, or "store" for orders placed on the main store. */
  source?: string;
  sort?: "newest" | "oldest" | "highest" | "lowest";
};

const SORTS = {
  newest: `o."createdAt" desc`,
  oldest: `o."createdAt" asc`,
  highest: `o.total desc, o."createdAt" desc`,
  lowest: `o.total asc, o."createdAt" desc`,
} as const;

const isDate = (s?: string): s is string => !!s && /^\d{4}-\d{2}-\d{2}$/.test(s);

/** WHERE clause and params for everything except the status tab. */
function baseFilter(query: OrderQuery) {
  const clauses: string[] = [];
  const params: unknown[] = [];
  const param = (value: unknown) => { params.push(value); return `$${params.length}`; };

  const q = query.q?.trim();
  if (q) {
    const like = param(`%${q.replace(/[\\%_]/g, "\\$&").replace(/^#/, "")}%`);
    clauses.push(`(
      o.id::text ilike ${like} or o.email ilike ${like} or o."customerPhone" ilike ${like}
      or o."cashfreeOrderId" ilike ${like} or o."cashfreePaymentId" ilike ${like} or o."couponCode" ilike ${like}
      or exists (select 1 from public."orderItem" s where s."orderId" = o.id and s."productName" ilike ${like})
    )`);
  }
  if (isDate(query.from)) clauses.push(`${LOCAL}::date >= ${param(query.from)}::date`);
  if (isDate(query.to)) clauses.push(`${LOCAL}::date <= ${param(query.to)}::date`);
  if (query.productId) {
    clauses.push(`exists (select 1 from public."orderItem" p where p."orderId" = o.id and p."productId" = ${param(query.productId)})`);
  }
  if (query.source === "store") clauses.push(`o.source is null`);
  else if (query.source) clauses.push(`o.source = ${param(query.source)}`);
  if (query.coupon === "with") clauses.push(`o."couponCode" is not null`);
  if (query.coupon === "without") clauses.push(`o."couponCode" is null`);

  return { where: clauses.length ? clauses.join(" and ") : "true", params, param };
}

export type AdminOrderRow = {
  id: string;
  email: string | null;
  phone: string | null;
  status: string;
  paymentStatus: string;
  total: number;
  discountAmount: number;
  refundedAmount: number;
  couponCode: string | null;
  cashfreeOrderId: string | null;
  source: string | null;
  createdAt: Date;
  products: string[];
  combos: string[];
};

export async function getAdminOrders(query: OrderQuery, { limit, offset }: { limit: number; offset: number }) {
  const { where, params, param } = baseFilter(query);
  const statusWhere = ORDER_FILTERS[query.status].where;

  const countsSql = (Object.keys(ORDER_FILTERS) as OrderFilter[])
    .map((key) => `count(*) filter (where ${ORDER_FILTERS[key].where}) as "${key}"`)
    .join(", ");

  const baseParams = [...params];
  const [{ rows }, { rows: [counts] }, { rows: [totals] }] = await Promise.all([
    pool.query(`
      select o.id, o.email, o."customerPhone" as phone, o.status, o."paymentStatus", o.total,
        o."discountAmount", o."refundedAmount", o."couponCode", o."cashfreeOrderId", o.source, o."createdAt",
        coalesce((select array_agg(i."productName" order by i."productName") from public."orderItem" i where i."orderId" = o.id), '{}') as products,
        coalesce((select array_agg(distinct i."offerName") from public."orderItem" i where i."orderId" = o.id and i."offerName" is not null), '{}') as combos
      from public."order" o
      where ${where} and ${statusWhere}
      order by ${SORTS[query.sort ?? "newest"]}
      limit ${param(limit)} offset ${param(offset)}
    `, params),
    pool.query(`select ${countsSql} from public."order" o where ${where}`, baseParams),
    pool.query(`
      select count(*) as orders, coalesce(sum(${NET}) filter (where o.status = 'PAID'), 0) as revenue
      from public."order" o where ${where} and ${statusWhere}
    `, baseParams),
  ]);

  return {
    orders: rows.map((r) => ({ ...r, total: num(r.total), discountAmount: num(r.discountAmount), refundedAmount: num(r.refundedAmount) })) as AdminOrderRow[],
    counts: Object.fromEntries(Object.entries(counts).map(([k, v]) => [k, num(v)])) as Record<OrderFilter, number>,
    matching: { orders: num(totals.orders), revenue: num(totals.revenue) },
  };
}

/** Products that appear on any order, for the product filter (retired ones included). */
export async function getOrderedProducts() {
  const { rows } = await pool.query(`
    select i."productId" as id, max(i."productName") as name
    from public."orderItem" i group by 1 order by 2
  `);
  return rows as { id: string; name: string }[];
}

export async function getRecentPaidOrders(limit = 8) {
  const { rows } = await pool.query(`
    select o.id, o.email, o.total, o."createdAt",
      coalesce((select array_agg(i."productName") from public."orderItem" i where i."orderId" = o.id), '{}') as products
    from public."order" o
    where o.status = 'PAID'
    order by o."createdAt" desc
    limit $1
  `, [limit]);
  return rows.map((r) => ({ ...r, total: num(r.total) })) as { id: string; email: string | null; total: number; createdAt: Date; products: string[] }[];
}

/** Orders that need an admin: paid-but-flagged, or refunds in flight. */
export async function getAttentionCounts() {
  const { rows: [r] } = await pool.query(`
    select
      count(*) filter (where o."paymentStatus" = 'REVIEW_REQUIRED') as review,
      count(*) filter (where o."paymentStatus" = 'REFUND_PENDING') as "refundPending",
      count(*) filter (where o.status = 'PENDING' and o."paymentStatus" in ('ACTIVE','PENDING')
        and o."createdAt" < now() - interval '30 minutes' and o."createdAt" > now() - interval '3 days') as stuck
    from public."order" o
  `);
  return { review: num(r.review), refundPending: num(r.refundPending), stuck: num(r.stuck) };
}

/** Landing page slugs that have orders, for the orders-list source filter. */
export async function getOrderSources() {
  const { rows } = await pool.query(`select distinct source from public."order" where source is not null order by 1`);
  return rows.map((r) => r.source as string);
}

/** Paid sales per source: each landing page, and the main store (null). */
export async function getSourcePerformance({ from, to }: DateRange) {
  const { rows } = await pool.query(`
    select o.source, count(*) as orders, coalesce(sum(${NET}), 0) as revenue
    from public."order" o
    where o.status = 'PAID' and ${RANGE}
    group by 1
    order by revenue desc
  `, [from, to]);
  return rows.map((r) => ({ source: r.source as string | null, orders: num(r.orders), revenue: num(r.revenue) }));
}

/** Paid combo sales: orders containing each combo and the revenue its products brought in. */
export async function getComboPerformance({ from, to }: DateRange) {
  const { rows } = await pool.query(`
    select i."offerName" as name, count(distinct o.id) as orders, coalesce(sum(i."finalPrice"), 0) as revenue
    from public."orderItem" i
    join public."order" o on o.id = i."orderId"
    where o.status = 'PAID' and i."offerName" is not null and ${RANGE}
    group by 1
    order by revenue desc
  `, [from, to]);
  return rows.map((r) => ({ name: r.name as string, orders: num(r.orders), revenue: num(r.revenue) }));
}

// ── Landing page tracking ───────────────────────────────────────────────────
// Events count unique visitors (distinct visitorId) per step; purchases come
// from orders carrying the same landing slug.

const E_LOCAL = `(e."createdAt" at time zone 'Asia/Kolkata')`;
const E_RANGE = `${E_LOCAL}::date between $1::date and $2::date`;

export type LandingFunnelRow = {
  slug: string;
  name: string | null;
  visitors: number;
  views: number;
  engaged: number;
  clicked: number;
  reachedCheckout: number;
  startedPayment: number;
  paid: number;
  revenue: number;
};

/** Per landing page: visit → scroll → buy click → checkout → payment started → paid. */
export async function getLandingFunnel({ from, to }: DateRange): Promise<LandingFunnelRow[]> {
  const { rows } = await pool.query(`
    with ev as (
      select e."landingSlug" as slug,
        count(distinct e."visitorId") filter (where e.type = 'view') as visitors,
        count(*) filter (where e.type = 'view') as views,
        count(distinct e."visitorId") filter (where e.type = 'scroll') as engaged,
        count(distinct e."visitorId") filter (where e.type = 'cta') as clicked,
        count(distinct e."visitorId") filter (where e.type = 'checkout') as "reachedCheckout"
      from public."landingEvent" e
      where ${E_RANGE}
      group by 1
    ),
    ord as (
      select o.source as slug,
        count(*) filter (where o."paymentStatus" <> 'NOT_STARTED' or o.status <> 'PENDING') as "startedPayment",
        count(*) filter (where o.status = 'PAID') as paid,
        coalesce(sum(${NET}) filter (where o.status = 'PAID'), 0) as revenue
      from public."order" o
      where o.source is not null and ${RANGE}
      group by 1
    )
    select coalesce(ev.slug, ord.slug) as slug, lp.name,
      coalesce(ev.visitors, 0) as visitors, coalesce(ev.views, 0) as views, coalesce(ev.engaged, 0) as engaged,
      coalesce(ev.clicked, 0) as clicked, coalesce(ev."reachedCheckout", 0) as "reachedCheckout",
      coalesce(ord."startedPayment", 0) as "startedPayment", coalesce(ord.paid, 0) as paid, coalesce(ord.revenue, 0) as revenue
    from ev
    full outer join ord on ord.slug = ev.slug
    left join public."landingPage" lp on lp.slug = coalesce(ev.slug, ord.slug)
    order by revenue desc, visitors desc
  `, [from, to]);
  return rows.map((r) => ({
    slug: r.slug, name: r.name, visitors: num(r.visitors), views: num(r.views), engaged: num(r.engaged),
    clicked: num(r.clicked), reachedCheckout: num(r.reachedCheckout), startedPayment: num(r.startedPayment),
    paid: num(r.paid), revenue: num(r.revenue),
  }));
}

export type CampaignRow = { source: string; campaign: string; content: string | null; visitors: number; clicked: number; paid: number; revenue: number };

/** Ad performance by UTM source + campaign (+ ad content), from first visit to paid order. */
export async function getCampaignPerformance({ from, to }: DateRange): Promise<CampaignRow[]> {
  const { rows } = await pool.query(`
    with ev as (
      select coalesce(e."utmSource", '(direct)') as source, coalesce(e."utmCampaign", '(none)') as campaign, e."utmContent" as content,
        count(distinct e."visitorId") filter (where e.type = 'view') as visitors,
        count(distinct e."visitorId") filter (where e.type = 'cta') as clicked
      from public."landingEvent" e
      where ${E_RANGE}
      group by 1, 2, 3
    ),
    ord as (
      select coalesce(o."utmSource", '(direct)') as source, coalesce(o."utmCampaign", '(none)') as campaign, o."utmContent" as content,
        count(*) as paid, coalesce(sum(${NET}), 0) as revenue
      from public."order" o
      where o.status = 'PAID' and o.source is not null and ${RANGE}
      group by 1, 2, 3
    )
    select coalesce(ev.source, ord.source) as source, coalesce(ev.campaign, ord.campaign) as campaign,
      coalesce(ev.content, ord.content) as content,
      coalesce(ev.visitors, 0) as visitors, coalesce(ev.clicked, 0) as clicked,
      coalesce(ord.paid, 0) as paid, coalesce(ord.revenue, 0) as revenue
    from ev
    full outer join ord on ord.source = ev.source and ord.campaign = ev.campaign and ord.content is not distinct from ev.content
    order by revenue desc, visitors desc
    limit 50
  `, [from, to]);
  return rows.map((r) => ({
    source: r.source, campaign: r.campaign, content: r.content, visitors: num(r.visitors),
    clicked: num(r.clicked), paid: num(r.paid), revenue: num(r.revenue),
  }));
}

export type LandingDay = { day: string; visitors: number; clicked: number; paid: number; revenue: number };

/** Landing traffic and sales per IST day, zero-filled. `slug` narrows to one page. */
export async function getLandingDaily({ from, to }: DateRange, slug?: string): Promise<LandingDay[]> {
  const { rows } = await pool.query(`
    with days as (
      select d::date as day from generate_series($1::date::timestamp, $2::date::timestamp, interval '1 day') d
    ),
    ev as (
      select ${E_LOCAL}::date as day,
        count(distinct e."visitorId") filter (where e.type = 'view') as visitors,
        count(distinct e."visitorId") filter (where e.type = 'cta') as clicked
      from public."landingEvent" e
      where ${E_RANGE} and ($3::text is null or e."landingSlug" = $3)
      group by 1
    ),
    ord as (
      select ${LOCAL}::date as day, count(*) as paid, coalesce(sum(${NET}), 0) as revenue
      from public."order" o
      where o.status = 'PAID' and o.source is not null and ${RANGE} and ($3::text is null or o.source = $3)
      group by 1
    )
    select to_char(days.day, 'YYYY-MM-DD') as day,
      coalesce(ev.visitors, 0) as visitors, coalesce(ev.clicked, 0) as clicked,
      coalesce(ord.paid, 0) as paid, coalesce(ord.revenue, 0) as revenue
    from days
    left join ev on ev.day = days.day
    left join ord on ord.day = days.day
    order by days.day
  `, [from, to, slug ?? null]);
  return rows.map((r) => ({ day: r.day, visitors: num(r.visitors), clicked: num(r.clicked), paid: num(r.paid), revenue: num(r.revenue) }));
}

/** Unique landing visitors by device, referring site and country. */
export async function getLandingAudience({ from, to }: DateRange, slug?: string) {
  const query = (column: string) => pool.query(`
    select coalesce(e.${column}, 'unknown') as key, count(distinct e."visitorId") as visitors
    from public."landingEvent" e
    where e.type = 'view' and ${E_RANGE} and ($3::text is null or e."landingSlug" = $3)
    group by 1 order by visitors desc limit 10
  `, [from, to, slug ?? null]);
  const [devices, referrers, countries] = await Promise.all([query("device"), query("referrer"), query("country")]);
  const map = (rows: { key: string; visitors: unknown }[]) => rows.map((r) => ({ key: r.key, visitors: num(r.visitors) }));
  return { devices: map(devices.rows), referrers: map(referrers.rows), countries: map(countries.rows) };
}
