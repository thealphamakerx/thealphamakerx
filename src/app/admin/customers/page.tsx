import Link from "next/link";
import { getCustomersAdmin } from "@/lib/admin";
import { formatDateTime, plural, rupees } from "@/lib/admin-format";
import { Card, CardContent } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function AdminCustomersPage() {
  const customers = await getCustomersAdmin();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Customers</h1>
        <p className="text-sm text-muted-foreground">{plural(customers.length, "buyer")}, by email, highest spend first</p>
      </div>

      {customers.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            No customers yet.
          </CardContent>
        </Card>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border bg-card">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted-foreground">
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 text-right font-medium">Paid orders</th>
                <th className="px-4 py-3 text-right font-medium">Spent</th>
                <th className="px-4 py-3 font-medium">First order</th>
                <th className="px-4 py-3 font-medium">Last order</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => (
                <tr key={c.email} className="border-b border-border last:border-0 hover:bg-secondary/40">
                  <td className="max-w-72 truncate px-4 py-3">
                    <Link href={`/admin/orders?q=${encodeURIComponent(c.email)}`} className="hover:underline">{c.email}</Link>
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">{c.paidCount}</td>
                  <td className="px-4 py-3 text-right font-medium tabular-nums">{rupees(c.totalSpent)}</td>
                  <td className="px-4 py-3 text-muted-foreground">{formatDateTime(c.firstOrderAt)}</td>
                  <td className="px-4 py-3 text-muted-foreground">{formatDateTime(c.lastOrderAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
