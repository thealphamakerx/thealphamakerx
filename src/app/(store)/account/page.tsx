import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { getOrdersForUser } from "@/lib/orders";
import { formatPrice } from "@/lib/pricing";
import { ORDER_STATUS_LABELS } from "@/constants";

export const dynamic = "force-dynamic";

const QUICK_LINKS = [
  { label: "Purchases", href: "/account/orders" },
  { label: "Wishlist", href: "/account/wishlist" },
];

export default async function AccountOverviewPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/auth/signin");

  const orders = await getOrdersForUser(session.user.id);
  const mostRecent = orders[0];

  return (
    <main className="mx-auto w-full max-w-(--breakpoint-md) flex-1 px-6 py-12">
      <h1 className="mb-2 text-2xl font-semibold">My Account</h1>
      <p className="mb-8 text-sm text-muted-foreground">
        Signed in as {session.user.email}
      </p>

      <div className="mb-8 grid grid-cols-2 gap-4">
        {QUICK_LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="flex items-center justify-center rounded-2xl border border-border px-2 py-6 text-center text-sm font-medium transition-colors hover:bg-secondary/40"
          >
            {link.label}
          </Link>
        ))}
      </div>

      {mostRecent && (
        <Link
          href={`/account/orders/${mostRecent.id}`}
          className="flex items-center justify-between rounded-2xl border border-border p-4 transition-colors hover:bg-secondary/40"
        >
          <div className="flex flex-col gap-0.5">
            <span className="text-xs text-muted-foreground">Most recent order</span>
            <span className="text-sm font-medium">
              #{mostRecent.id.slice(0, 8).toUpperCase()} ·{" "}
              {ORDER_STATUS_LABELS[mostRecent.status]}
            </span>
          </div>
          <span className="text-sm font-medium">{formatPrice(mostRecent.total)}</span>
        </Link>
      )}
    </main>
  );
}
