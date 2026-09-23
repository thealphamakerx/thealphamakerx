import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getAdminOrders, istToday } from "@/lib/admin-analytics";
import { parseOrderQuery } from "@/lib/admin-order-query";

const MAX_ROWS = 20_000;

/** Quote a CSV cell, and neutralise values a spreadsheet would run as a formula. */
function cell(value: unknown) {
  let text = value === null || value === undefined ? "" : String(value);
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

const rupees = (paise: number) => (paise / 100).toFixed(2);

export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session || (session.user as { role?: string }).role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const query = parseOrderQuery(Object.fromEntries(request.nextUrl.searchParams));
  const { orders } = await getAdminOrders(query, { limit: MAX_ROWS, offset: 0 });

  const header = ["Order ID", "Date (IST)", "Email", "Phone", "Products", "Status", "Payment status", "Coupon", "Discount (INR)", "Total (INR)", "Refunded (INR)", "Cashfree order ID", "Combo", "Source"];
  const lines = orders.map((o) => [
    o.id,
    new Date(o.createdAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }),
    o.email,
    o.phone,
    o.products.join("; "),
    o.status,
    o.paymentStatus,
    o.couponCode,
    rupees(o.discountAmount),
    rupees(o.total),
    rupees(o.refundedAmount),
    o.cashfreeOrderId,
    o.combos.join("; "),
    o.source ?? "store",
  ].map(cell).join(","));

  return new NextResponse(`﻿${[header.join(","), ...lines].join("\r\n")}\r\n`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="orders-${istToday()}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
