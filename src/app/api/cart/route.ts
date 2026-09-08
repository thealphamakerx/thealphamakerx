import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getCartSummary } from "@/lib/cart";
import type { CartItem } from "@/types";

export async function POST(request: NextRequest) {
  const { items, couponCode }: { items: CartItem[]; couponCode?: string } = await request.json();

  const session = await auth.api.getSession({ headers: request.headers });

  const summary = await getCartSummary(items ?? [], {
    couponCode,
    userId: session?.user.id,
  });

  return NextResponse.json(summary);
}
