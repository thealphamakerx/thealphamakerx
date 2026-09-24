import { db } from "@/lib/db";
import { verifyOrderAccessToken } from "@/lib/order-token";
import { getProductDownloadUrl } from "@/lib/storage";

export type DownloadAuthorization =
  | { ok: true; url: string }
  | { ok: false; status: 403 | 404; error: string };

const forbidden = (error: string) => ({ ok: false, status: 403, error }) as const;

const lookups = {
  order: (id: string) => db.orm.public.Order.first({ id }),
  orderItem: (orderId: string, productId: string) => db.orm.public.OrderItem.first({ orderId, productId }),
  product: (id: string) => db.orm.public.Product.first({ id }),
};

type Lookups = {
  order: (id: string) => Promise<{ userId: string; email: string | null; status: string } | null>;
  orderItem: (orderId: string, productId: string) => Promise<object | null>;
  product: (id: string) => Promise<Parameters<typeof getProductDownloadUrl>[0] | null>;
};

/**
 * Decide whether a buyer may download a product, and only then mint a
 * short-lived R2 URL. There are no customer logins: the buyer is identified
 * by their order link — an HMAC-signed token for one order, shown on the
 * confirmation page and sent to the email address on that order. Every check
 * runs on every request, so a refunded or cancelled order stops working at
 * once, and nothing is signed unless all of them pass.
 */
export async function authorizeDownload(
  token: string,
  productId: string,
  find: Lookups = lookups
): Promise<DownloadAuthorization> {
  // 1. The buyer is authenticated by a link we signed for their order's email.
  const orderId = verifyOrderAccessToken(token);
  if (!orderId) return forbidden("Invalid or broken download link");

  // 2. The order exists…
  const order = await find.order(orderId);
  if (!order?.email) return forbidden("Order not found");

  // 3. …and belongs to that email (checkout records the owner as guest:<email>).
  if (order.userId !== `guest:${order.email.toLowerCase()}`) return forbidden("Order not found");

  // 4. Payment was verified server-side against the gateway (only then is an
  //    order marked PAID; refunds and cancellations move it off PAID).
  if (order.status !== "PAID") return forbidden("This order isn't paid");

  // 5. The product was bought in this order.
  const item = await find.orderItem(orderId, productId);
  if (!item) return forbidden("You haven't purchased this product");

  // 6. There is a file to hand over.
  const product = await find.product(productId);
  if (!product) return { ok: false, status: 404, error: "Product not found" };
  const url = await getProductDownloadUrl(product);
  if (!url) return { ok: false, status: 404, error: "The file for this product isn't available yet" };

  // 7. Short-lived presigned R2 URL (see DOWNLOAD_URL_TTL_SECONDS).
  return { ok: true, url };
}
