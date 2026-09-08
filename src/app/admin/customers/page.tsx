import { getCustomersAdmin } from "@/lib/admin";
import { formatPrice } from "@/lib/pricing";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function AdminCustomersPage() {
  const customers = await getCustomersAdmin();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Customers</h1>

      {customers.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            No customers yet.
          </CardContent>
        </Card>
      ) : (
        <Card className="py-0">
          <div className="flex flex-col divide-y divide-border">
            {customers.map((customer) => (
              <div key={customer.id} className="flex items-center justify-between p-4 text-sm">
                <div className="flex flex-col gap-0.5">
                  <span className="font-medium">{customer.name || customer.email}</span>
                  <span className="text-xs text-muted-foreground">{customer.email}</span>
                </div>
                {customer.role === "ADMIN" && <Badge variant="secondary">Admin</Badge>}
                <span className="text-muted-foreground">{customer.orderCount} orders</span>
                <span className="font-medium">{formatPrice(customer.totalSpent)}</span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
