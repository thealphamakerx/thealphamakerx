import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import { getUserById } from "@/lib/users";
import { sendOrderStatusEmail } from "@/lib/email";

export async function PATCH(
  request: NextRequest,
  { params }: RouteContext<"/api/admin/orders/[id]">
) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session || (session.user as { role?: string }).role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const { status } = await request.json();

  const order = await db.orm.public.Order.first({ id });
  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  await db.orm.public.Order.where({ id }).update({ status });

  await logAudit({
    actorUserId: session.user.id,
    action: "order.status_changed",
    entityType: "Order",
    entityId: id,
    before: { status: order.status },
    after: { status },
  });

  const customer = await getUserById(order.userId);
  if (customer) {
    await sendOrderStatusEmail({ to: customer.email, orderId: id, status });
  }

  return NextResponse.json({ ok: true });
}
