import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const { productId } = await request.json();

  const existing = await db.orm.public.Wishlist.first({
    userId: session.user.id,
    productId,
  });

  if (existing) {
    await db.orm.public.Wishlist.where({ id: existing.id }).delete();
    return NextResponse.json({ inWishlist: false });
  }

  await db.orm.public.Wishlist.create({ userId: session.user.id, productId });
  return NextResponse.json({ inWishlist: true });
}
