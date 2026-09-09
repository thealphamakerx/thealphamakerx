import { notFound } from "next/navigation";
import { Download } from "lucide-react";
import { verifyOrderAccessToken } from "@/lib/order-token";
import { getOrderById } from "@/lib/orders";
import { formatPrice } from "@/lib/pricing";
import { buttonVariants } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function GuestDownloadPage({
  params,
}: PageProps<"/download/[token]">) {
  const { token } = await params;

  const orderId = verifyOrderAccessToken(token);
  if (!orderId) notFound();

  const order = await getOrderById(orderId);
  if (!order) notFound();

  return (
    <main className="mx-auto flex w-full max-w-(--breakpoint-sm) flex-1 flex-col gap-6 px-6 py-16">
      <div className="flex flex-col gap-1 text-center">
        <h1 className="text-2xl font-semibold">Your Purchase</h1>
        <p className="text-sm text-muted-foreground">
          Order #{order.id.slice(0, 8).toUpperCase()} · {formatPrice(order.total)}
        </p>
      </div>

      {order.status === "PAID" ? (
        <div className="flex flex-col divide-y divide-border rounded-2xl border border-border">
          {order.items.map((item) => (
            <div key={item.id} className="flex items-center justify-between gap-4 p-4">
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-medium">{item.productName}</span>
                <span className="text-xs text-muted-foreground">Qty {item.quantity}</span>
              </div>
              <a
                href={`/api/download/${token}/${item.productId}`}
                className={buttonVariants({ size: "sm" })}
              >
                <Download className="size-4" />
                Download
              </a>
            </div>
          ))}
        </div>
      ) : order.status === "PENDING" ? (
        <p className="text-center text-sm text-muted-foreground">
          We&apos;re still confirming your payment — refresh this page in a moment, or check
          your email for the link once it&apos;s done.
        </p>
      ) : (
        <p className="text-center text-sm text-muted-foreground">
          This order is {order.status.toLowerCase()} and no longer has active downloads.
        </p>
      )}

      <p className="text-center text-xs text-muted-foreground">
        Bookmark this page or keep the email we sent you — it&apos;s the easiest way back to
        your files.
      </p>
    </main>
  );
}
