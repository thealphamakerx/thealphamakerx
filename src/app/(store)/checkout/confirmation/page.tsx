import { notFound } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, Clock, XCircle } from "lucide-react";
import { db } from "@/lib/db";
import { getOrderById } from "@/lib/orders";
import { canAccessOrder } from "@/lib/payments/access";
import { PaymentConfirmed } from "@/components/checkout/payment-confirmed";
import { paymentStatusLabel } from "@/lib/payments/labels";
import { createOrderAccessToken, createOrdersKey } from "@/lib/order-token";
import { formatPrice } from "@/lib/pricing";
import { ORDER_STATUS_LABELS } from "@/constants";
import { buttonVariants } from "@/components/ui/button";
import { PendingPaymentRefresher } from "@/components/checkout/pending-payment-refresher";
import { MetaPurchase } from "@/components/analytics/meta-purchase";

export const dynamic = "force-dynamic";

export default async function CheckoutConfirmationPage({
  searchParams,
}: PageProps<"/checkout/confirmation">) {
  const { orderId, token: tokenParam } = await searchParams;
  const token = typeof tokenParam === "string" ? tokenParam : "";
  if (!orderId || Array.isArray(orderId)) notFound();

  const order = await getOrderById(orderId);
  if (!order || !canAccessOrder(order, undefined, token)) notFound();

  const orderNumber = order.id.slice(0, 8).toUpperCase();

  if (order.status === "PENDING") {
    const retryProduct = order.items[0]
      ? await db.orm.public.Product.first({ id: order.items[0].productId, isActive: true })
      : null;
    return (
      <main className="mx-auto flex w-full max-w-(--breakpoint-sm) flex-1 flex-col items-center justify-center gap-4 px-6 py-16 text-center">
        <Clock className="size-12 text-muted-foreground" />
        <h1 className="text-2xl font-semibold">{paymentStatusLabel(order.paymentStatus)}</h1>
        <p className="text-sm text-muted-foreground">
          Order #{orderNumber} · {formatPrice(order.total)}
        </p>
        <p className="max-w-sm text-sm text-muted-foreground">
          Access unlocks only after payment is confirmed. If your attempt failed or was interrupted, you haven&apos;t been charged — you can try again.
          {order.email && " You'll also get an email once it's done."}
        </p>
        <PendingPaymentRefresher orderId={order.id} token={token} initialStatus={order.paymentStatus} />
        <Link href={retryProduct ? `/checkout?product=${encodeURIComponent(retryProduct.slug)}` : "/shop"} className={buttonVariants({ variant: "outline" })}>Try again</Link>
      </main>
    );
  }

  if (order.status !== "PAID") {
    return (
      <main className="mx-auto flex w-full max-w-(--breakpoint-sm) flex-1 flex-col items-center justify-center gap-4 px-6 py-16 text-center">
        <XCircle className="size-12 text-destructive" />
        <h1 className="text-2xl font-semibold">Order {ORDER_STATUS_LABELS[order.status]}</h1>
        <p className="text-sm text-muted-foreground">
          Order #{orderNumber} · {formatPrice(order.total)}
        </p>
        <Link href="/contact" className={buttonVariants({ variant: "outline", className: "mt-2" })}>
          Contact Us
        </Link>
      </main>
    );
  }

  const downloadUrl = `/download/${createOrderAccessToken(order.id)}`;

  return (
    <main className="mx-auto flex w-full max-w-(--breakpoint-sm) flex-1 flex-col items-center justify-center gap-4 px-6 py-16 text-center">
      <PaymentConfirmed orderId={order.id} ordersKey={order.email ? createOrdersKey(order.email) : null} />
      <MetaPurchase
        orderId={order.id}
        total={order.total}
        items={order.items.map((item) => ({ productId: item.productId, quantity: item.quantity }))}
      />
      <CheckCircle2 className="size-12 text-success" />
      <h1 className="text-2xl font-semibold">You&apos;re In!</h1>
      <p className="text-sm text-muted-foreground">
        Order #{orderNumber} · {formatPrice(order.total)}
      </p>
      <p className="max-w-sm text-sm text-muted-foreground">
        Your access is unlocked.{" "}
        {order.email && `Your download link has also been sent to ${order.email}. `}
        You can find this order any time on the My Orders page.
      </p>

      <div className="mt-2 flex flex-wrap justify-center gap-2">
        <Link href={downloadUrl} className={buttonVariants()}>
          Get Your Files
        </Link>
        <Link href="/orders" className={buttonVariants({ variant: "outline" })}>
          My Orders
        </Link>
      </div>
    </main>
  );
}
