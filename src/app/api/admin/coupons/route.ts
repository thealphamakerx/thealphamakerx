import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { logAudit } from "@/lib/audit";

async function requireAdmin(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  return session && (session.user as { role?: string }).role === "ADMIN" ? session : null;
}

export async function GET(request: NextRequest) {
  if (!(await requireAdmin(request))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const coupons = await db.orm.public.Coupon.orderBy((c) => c.createdAt.desc()).all();
  return NextResponse.json(coupons);
}

export async function POST(request: NextRequest) {
  const session = await requireAdmin(request);
  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();

  const coupon = await db.orm.public.Coupon.create({
    code: String(body.code).trim().toUpperCase(),
    discountType: body.discountType,
    discountValue: Number(body.discountValue),
    minOrderAmount: Number(body.minOrderAmount) || 0,
    maxDiscountAmount: body.maxDiscountAmount ? Number(body.maxDiscountAmount) : undefined,
    usageLimit: body.usageLimit ? Number(body.usageLimit) : undefined,
    perCustomerLimit: body.perCustomerLimit ? Number(body.perCustomerLimit) : undefined,
    active: true,
  });

  await logAudit({
    actorUserId: session.user.id,
    action: "coupon.created",
    entityType: "Coupon",
    entityId: coupon.id,
    after: { code: coupon.code, discountType: coupon.discountType, discountValue: coupon.discountValue },
  });

  return NextResponse.json(coupon, { status: 201 });
}
