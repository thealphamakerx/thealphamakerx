import Link from "next/link";
import { IndianRupee, ShoppingBag, Package, Users } from "lucide-react";
import { getDashboardStats, getRecentOrdersAdmin } from "@/lib/admin";
import { formatPrice } from "@/lib/pricing";
import { ORDER_STATUS_LABELS } from "@/constants";
import type { OrderStatus } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

const STATUS_VARIANT: Record<OrderStatus, "default" | "secondary" | "destructive"> = {
  PENDING: "secondary",
  PAID: "default",
  CANCELLED: "destructive",
  REFUNDED: "destructive",
};

export default async function AdminDashboardPage() {
  const [stats, recentOrders] = await Promise.all([
    getDashboardStats(),
    getRecentOrdersAdmin(),
  ]);

  const kpis = [
    { label: "Revenue", value: formatPrice(stats.revenue), icon: IndianRupee, color: "text-success" },
    { label: "Orders", value: stats.orderCount, icon: ShoppingBag, color: "text-primary" },
    { label: "Products", value: stats.productCount, icon: Package, color: "text-blue-500" },
    { label: "Customers", value: stats.customerCount, icon: Users, color: "text-purple-500" },
  ];

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-2xl font-semibold">Dashboard</h1>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {kpis.map(({ label, value, icon: Icon, color }) => (
          <Card key={label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
              <Icon className={`size-4 ${color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold">{value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div>
        <h2 className="mb-4 text-sm font-medium">Recent Orders</h2>
        {recentOrders.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-sm text-muted-foreground">
              No orders yet.
            </CardContent>
          </Card>
        ) : (
          <Card className="py-0">
            <div className="flex flex-col divide-y divide-border">
              {recentOrders.map((order) => (
                <Link
                  key={order.id}
                  href={`/admin/orders/${order.id}`}
                  className="flex items-center justify-between p-4 text-sm hover:bg-secondary/40"
                >
                  <span className="font-medium">#{order.id.slice(0, 8).toUpperCase()}</span>
                  <span className="text-muted-foreground">{order.customerEmail}</span>
                  <Badge variant={STATUS_VARIANT[order.status as OrderStatus]}>
                    {ORDER_STATUS_LABELS[order.status as OrderStatus]}
                  </Badge>
                  <span className="font-medium">{formatPrice(order.total)}</span>
                </Link>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
