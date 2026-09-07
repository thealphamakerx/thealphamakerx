import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  const orders = await db.orm.public.Order
    .orderBy((o) => o.createdAt.desc())
    .all();

  return NextResponse.json(orders);
}

export async function POST(request: NextRequest) {
  const data = await request.json();

  const order = await db.orm.public.Order.create(data);

  return NextResponse.json(order, { status: 201 });
}
