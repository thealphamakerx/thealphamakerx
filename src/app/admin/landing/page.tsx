import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { db } from "@/lib/db";
import { getLandingFunnel, istDaysAgo, istToday } from "@/lib/admin-analytics";
import { getAllProducts } from "@/lib/products";
import { percent, rupees } from "@/lib/admin-format";
import { Badge } from "@/components/ui/badge";
import { NewLandingForm } from "@/components/admin/new-landing-form";

export const dynamic = "force-dynamic";

export default async function AdminLandingPagesPage() {
  const [pages, { products }, funnel] = await Promise.all([
    db.orm.public.LandingPage.orderBy((p) => p.createdAt.desc()).all(),
    getAllProducts(1, { includeInactive: true }),
    getLandingFunnel({ from: istDaysAgo(29), to: istToday() }),
  ]);
  const productName = new Map(products.map((p) => [p.id, p.name]));
  const statsBySlug = new Map(funnel.map((f) => [f.slug, f]));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Landing pages</h1>
        <p className="text-sm text-muted-foreground">
          Focused sales pages with checkout built in. Share the /lp link in ads and bio links, or connect a domain of its own.
        </p>
      </div>

      <NewLandingForm products={products.filter((p) => p.isActive).map((p) => ({ id: p.id, name: p.name }))} />

      {pages.length === 0 ? (
        <p className="rounded-2xl border border-border bg-card py-10 text-center text-sm text-muted-foreground">No landing pages yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border bg-card">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted-foreground">
                <th className="px-4 py-3 font-medium">Page</th>
                <th className="px-4 py-3 font-medium">Product</th>
                <th className="px-4 py-3 font-medium">Address</th>
                <th className="px-4 py-3 text-right font-medium">Last 30 days</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {pages.map((page) => {
                const s = statsBySlug.get(page.slug);
                return (
                  <tr key={page.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-3">
                      <Link href={`/admin/landing/${page.id}`} className="font-medium hover:underline">{page.name}</Link>
                      <div className="mt-1">{page.isActive ? <Badge>Published</Badge> : <Badge variant="secondary">Draft</Badge>}</div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{productName.get(page.productId) ?? "—"}</td>
                    <td className="px-4 py-3 text-xs">
                      <p>/lp/{page.slug}</p>
                      {page.domain && <p className="text-muted-foreground">{page.domain}</p>}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {s ? (
                        <>
                          <p>{s.visitors} visitors · {percent(s.paid, s.visitors)}% bought</p>
                          <Link href={`/admin/orders?status=paid&source=${encodeURIComponent(page.slug)}`} className="text-xs text-muted-foreground hover:underline">
                            {s.paid} sales · {rupees(s.revenue)}
                          </Link>
                        </>
                      ) : "—"}
                    </td>
                    <td className="space-x-3 px-4 py-3 text-right whitespace-nowrap">
                      <Link href={`/admin/landing/${page.id}`} className="inline-flex items-center rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:bg-secondary/40">
                        Edit
                      </Link>
                      <a href={`/lp/${page.slug}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
                        {page.isActive ? "View" : "Preview"} <ExternalLink className="size-3.5" />
                      </a>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
