import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, Clock, XCircle } from "lucide-react";
import { auth } from "@/lib/auth";
import { getOrderById } from "@/lib/orders";
import { createOrderAccessToken } from "@/lib/order-token";
import { formatPrice } from "@/lib/pricing";
import { ORDER_STATUS_LABELS } from "@/constants";
import { buttonVariants } from "@/components/ui/button";
import { PendingPaymentRefresher } from "@/components/checkout/pending-payment-refresher";

export const dynamic = "force-dynamic";

export default async function CheckoutConfirmationPage({
  searchParams,
}: PageProps<"/checkout/confirmation">) {
  const { orderId } = await searchParams;
  if (!orderId || Array.isArray(orderId)) notFound();

  const session = await auth.api.getSession({ headers: await headers() });
  const order = await getOrderById(orderId);
  if (!order) notFound();

  const isGuestOrder = order.userId.startsWith("guest:");

  if (session) {
    if (order.userId !== session.user.id) notFound();
  } else if (!isGuestOrder) {
    // A logged-out browser hitting a real account's order — that's the
    // account/orders flow, not the guest one.
    redirect("/auth/signin");
  }

  const orderNumber = order.id.slice(0, 8).toUpperCase();

  if (order.status === "PENDING") {
    return (
      <main className="mx-auto flex w-full max-w-(--breakpoint-sm) flex-1 flex-col items-center justify-center gap-4 px-6 py-16 text-center">
        <Clock className="size-12 text-muted-foreground" />
        <h1 className="text-2xl font-semibold">Confirming Your Payment</h1>
        <p className="text-sm text-muted-foreground">
          Order #{orderNumber} · {formatPrice(order.total)}
        </p>
        <p className="max-w-sm text-sm text-muted-foreground">
          This usually takes a few seconds — this page will unlock automatically.
          {order.email && " You'll also get an email once it's done."}
        </p>
        <PendingPaymentRefresher />
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

  const guestDownloadUrl = isGuestOrder ? `/download/${createOrderAccessToken(order.id)}` : null;

  return (
    <main className="mx-auto flex w-full max-w-(--breakpoint-sm) flex-1 flex-col items-center justify-center gap-4 px-6 py-16 text-center">
      <CheckCircle2 className="size-12 text-success" />
      <h1 className="text-2xl font-semibold">You&apos;re In!</h1>
      <p className="text-sm text-muted-foreground">
        Order #{orderNumber} · {formatPrice(order.total)}
      </p>
      {isGuestOrder ? (
        <p className="max-w-sm text-sm text-muted-foreground">
          Your access is unlocked.{" "}
          {order.email && "We've also emailed this link to " + order.email + " — "}
          use the button below any time to get your files.
        </p>
      ) : (
        <p className="max-w-sm text-sm text-muted-foreground">
          Your access is unlocked. Head to your Purchases page any time to get to it.
        </p>
      )}

      {isGuestOrder ? (
        <Link href={guestDownloadUrl!} className={buttonVariants({ className: "mt-2" })}>
          Get Your Files
        </Link>
      ) : (
        <Link href="/account/orders" className={buttonVariants({ className: "mt-2" })}>
          Go to Your Purchases
        </Link>
      )}
    </main>
  );
}
