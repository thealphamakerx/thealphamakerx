import Link from "next/link";
import { CheckCircle2, CircleAlert } from "lucide-react";
import { paymentPool } from "@/lib/payments/pool";
import { emailBrand, getEmailSettings } from "@/lib/emails";
import { EMAIL_INFO, EMAIL_KINDS, type EmailKind } from "@/lib/email-templates";
import { count, formatDateTime } from "@/lib/admin-format";
import { siteConfig } from "@/config/site";
import { StatTile } from "@/components/admin/stat-tile";
import { EmailTemplatesEditor } from "@/components/admin/email-templates-editor";
import { DeliverNowButton, ResendEmailButton, UnsuppressButton } from "@/components/admin/email-actions";

export const dynamic = "force-dynamic";

const STATUSES = {
  all: { label: "All", where: "true" },
  sent: { label: "Sent", where: `e."sentAt" IS NOT NULL` },
  scheduled: { label: "Scheduled", where: `e."sentAt" IS NULL AND e."skippedReason" IS NULL AND e.attempts = 0` },
  failing: { label: "Failing", where: `e."sentAt" IS NULL AND e."skippedReason" IS NULL AND e.attempts > 0` },
  skipped: { label: "Skipped", where: `e."skippedReason" IS NOT NULL` },
  problems: { label: "Bounced / spam", where: `e."deliveryStatus" IN ('bounced','complained','failed')` },
} as const;
type Status = keyof typeof STATUSES;

function statusBadge(e: { sentAt: Date | null; skippedReason: string | null; attempts: number; sendAfter: Date; deliveryStatus: string | null; lastError: string | null }) {
  if (e.skippedReason) return { text: "Skipped", tone: "text-muted-foreground", detail: e.skippedReason };
  if (e.sentAt) {
    const bad = ["bounced", "complained", "failed"].includes(e.deliveryStatus ?? "");
    return { text: e.deliveryStatus ? e.deliveryStatus[0].toUpperCase() + e.deliveryStatus.slice(1) : "Sent", tone: bad ? "text-destructive" : "text-success", detail: null };
  }
  if (e.attempts > 0) return { text: `Retrying (${e.attempts})`, tone: "text-destructive", detail: e.lastError };
  return { text: new Date(e.sendAfter) > new Date() ? "Scheduled" : "Sending soon", tone: "text-muted-foreground", detail: new Date(e.sendAfter) > new Date() ? `at ${formatDateTime(e.sendAfter)}` : null };
}

export default async function AdminEmailsPage({ searchParams }: PageProps<"/admin/emails">) {
  const params = await searchParams;
  const status: Status = typeof params.status === "string" && params.status in STATUSES ? (params.status as Status) : "all";
  const kind = typeof params.kind === "string" && (EMAIL_KINDS as readonly string[]).includes(params.kind) ? params.kind : "";
  const q = typeof params.q === "string" ? params.q.trim().slice(0, 100) : "";

  const filters: string[] = [STATUSES[status].where];
  const values: unknown[] = [];
  if (kind) { values.push(kind); filters.push(`e.kind = $${values.length}`); }
  if (q) { values.push(`%${q.replace(/[\\%_]/g, "\\$&")}%`); filters.push(`(e.recipient ILIKE $${values.length} OR o.email ILIKE $${values.length} OR o.id::text ILIKE $${values.length})`); }

  const [settings, { rows: [stats] }, { rows: log }, { rows: suppressed }] = await Promise.all([
    getEmailSettings(),
    paymentPool.query(`
      SELECT
        count(*) FILTER (WHERE "sentAt" > now() - interval '7 days') AS sent,
        count(*) FILTER (WHERE "sentAt" > now() - interval '7 days' AND "deliveryStatus" IN ('delivered','opened','clicked')) AS delivered,
        count(*) FILTER (WHERE "sentAt" > now() - interval '7 days' AND "deliveryStatus" IN ('opened','clicked')) AS opened,
        count(*) FILTER (WHERE "sentAt" IS NULL AND "skippedReason" IS NULL AND attempts < 8) AS waiting,
        count(*) FILTER (WHERE "sentAt" IS NULL AND "skippedReason" IS NULL AND attempts > 0) AS failing,
        count(*) FILTER (WHERE "deliveryStatus" IN ('bounced','complained') AND "sentAt" > now() - interval '30 days') AS problems
      FROM public."paymentEmail"`),
    paymentPool.query(`
      SELECT e.*, o.email AS "orderEmail", o.total
      FROM public."paymentEmail" e JOIN public."order" o ON o.id = e."orderId"
      WHERE ${filters.join(" AND ")}
      ORDER BY coalesce(e."sentAt", e."sendAfter") DESC
      LIMIT 100`, values),
    paymentPool.query(`SELECT * FROM public."emailSuppression" ORDER BY "createdAt" DESC LIMIT 100`),
  ]);

  const checks = [
    { ok: !!process.env.RESEND_API_KEY, text: "RESEND_API_KEY is set", help: "Resend → API Keys → create a key with sending access." },
    { ok: !!process.env.RESEND_FROM_EMAIL, text: `Sending from ${process.env.RESEND_FROM_EMAIL ?? "(not set)"}`, help: "Set RESEND_FROM_EMAIL to an address on a domain verified in Resend, e.g. The Alpha Maker X <orders@thealphamakerx.in>." },
    { ok: !!process.env.RESEND_WEBHOOK_SECRET, text: "Delivery tracking webhook", help: `Resend → Webhooks → add ${siteConfig.url}/api/webhooks/resend (all email events), then set RESEND_WEBHOOK_SECRET to its signing secret.` },
    { ok: !!process.env.CRON_SECRET || !!process.env.PAYMENT_RECONCILE_SECRET, text: "Scheduled job for reminders", help: `Call ${siteConfig.url}/api/internal/cron every 5–15 minutes with "Authorization: Bearer <CRON_SECRET>" (Vercel Cron or cron-job.org).` },
  ];

  const filterHref = (patch: Record<string, string>) => {
    const next = new URLSearchParams({ ...(status !== "all" ? { status } : {}), ...(kind ? { kind } : {}), ...(q ? { q } : {}), ...patch });
    for (const [k, v] of [...next]) if (!v || v === "all") next.delete(k);
    return `/admin/emails?${next}`;
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Emails</h1>
          <p className="text-sm text-muted-foreground">Order confirmations, failed-payment nudges, checkout reminders and refunds — sent with Resend.</p>
        </div>
        <DeliverNowButton />
      </div>

      {checks.some((c) => !c.ok) && (
        <section className="flex flex-col gap-2 rounded-2xl border border-border bg-card p-5">
          <h2 className="text-sm font-semibold">Setup</h2>
          {checks.map((c) => (
            <div key={c.text} className="flex items-start gap-2 text-sm">
              {c.ok ? <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" /> : <CircleAlert className="mt-0.5 size-4 shrink-0 text-destructive" />}
              <div>
                <p>{c.text}</p>
                {!c.ok && <p className="text-xs text-muted-foreground">{c.help}</p>}
              </div>
            </div>
          ))}
        </section>
      )}

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatTile label="Sent · 7 days" value={count(Number(stats.sent))} lines={[`${count(Number(stats.delivered))} delivered · ${count(Number(stats.opened))} opened`]} />
        <StatTile label="Waiting to send" value={count(Number(stats.waiting))} lines={["Scheduled reminders and retries"]} />
        <StatTile label="Failing" value={count(Number(stats.failing))} lines={["Retried automatically with backoff"]} />
        <StatTile label="Bounced / spam · 30 days" value={count(Number(stats.problems))} lines={["These addresses get no more reminders"]} />
      </div>

      <section className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5">
        <h2 className="text-sm font-semibold">Templates &amp; timing</h2>
        <EmailTemplatesEditor initial={settings} brand={emailBrand()} />
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-sm font-semibold">Message log</h2>
        <div className="flex flex-wrap items-center gap-2">
          {(Object.keys(STATUSES) as Status[]).map((s) => (
            <Link key={s} href={filterHref({ status: s })}
              className={`rounded-lg border px-3 py-1.5 text-xs ${status === s ? "border-primary bg-accent text-accent-foreground" : "border-border text-muted-foreground hover:text-foreground"}`}>
              {STATUSES[s].label}
            </Link>
          ))}
          <form className="ml-auto flex gap-2" action="/admin/emails">
            {status !== "all" && <input type="hidden" name="status" value={status} />}
            <select name="kind" defaultValue={kind} className="h-8 rounded-lg border border-input bg-background px-2 text-xs">
              <option value="">All emails</option>
              {EMAIL_KINDS.map((k) => <option key={k} value={k}>{EMAIL_INFO[k].name}</option>)}
            </select>
            <input name="q" defaultValue={q} placeholder="Email or order #" className="h-8 w-44 rounded-lg border border-input bg-background px-2 text-xs" />
            <button className="h-8 rounded-lg border border-border px-3 text-xs hover:bg-secondary/40">Filter</button>
          </form>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-border bg-card">
          <table className="w-full min-w-[820px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted-foreground">
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">To</th>
                <th className="px-4 py-3 font-medium">Order</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">When</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {log.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">No emails match.</td></tr>
              )}
              {log.map((e) => {
                const badge = statusBadge(e);
                const info = EMAIL_INFO[e.kind as EmailKind];
                return (
                  <tr key={e.id} className="border-b border-border last:border-0 align-top">
                    <td className="px-4 py-3">{info?.name ?? e.kind}</td>
                    <td className="max-w-56 truncate px-4 py-3 text-muted-foreground">{e.recipient ?? (info?.category === "admin" ? "(you)" : e.orderEmail)}</td>
                    <td className="px-4 py-3"><Link href={`/admin/orders/${e.orderId}`} className="hover:underline">#{e.orderId.slice(0, 8).toUpperCase()}</Link></td>
                    <td className="max-w-64 px-4 py-3">
                      <span className={badge.tone}>{badge.text}</span>
                      {badge.detail && <p className="text-xs text-muted-foreground">{badge.detail}</p>}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">{formatDateTime(e.sentAt ?? e.sendAfter)}</td>
                    <td className="px-4 py-3 text-right">{(e.sentAt || e.skippedReason || e.attempts >= 8) && <ResendEmailButton id={e.id} />}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold">Not receiving reminders</h2>
        <p className="text-xs text-muted-foreground">Unsubscribed, bounced or marked as spam. They still get receipts and refund emails.</p>
        {suppressed.length === 0 ? (
          <p className="rounded-2xl border border-border bg-card py-6 text-center text-sm text-muted-foreground">Nobody yet.</p>
        ) : (
          <ul className="divide-y divide-border rounded-2xl border border-border bg-card">
            {suppressed.map((s) => (
              <li key={s.email} className="flex flex-wrap items-center gap-3 px-4 py-2.5 text-sm">
                <span className="min-w-0 flex-1 truncate">{s.email}</span>
                <span className="text-xs text-muted-foreground">{s.reason} · {formatDateTime(s.createdAt)}</span>
                <UnsuppressButton email={s.email} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
