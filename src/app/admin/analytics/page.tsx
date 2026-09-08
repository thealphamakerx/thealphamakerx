import Link from "next/link";

export default function AdminAnalyticsPage() {
  return (
    <div className="flex flex-col gap-2">
      <h1 className="text-2xl font-semibold">Analytics</h1>
      <p className="text-sm text-muted-foreground">
        Revenue, orders, product, and customer totals live on the{" "}
        <Link href="/admin/dashboard" className="underline">
          Dashboard
        </Link>{" "}
        for now. Deeper analytics (AOV, conversion rate, repeat-customer rate, funnel tracking) is
        planned for M8.
      </p>
    </div>
  );
}
