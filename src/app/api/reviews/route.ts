import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { findEligibleOrderForReview } from "@/lib/reviews";

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const { productId, rating, comment } = await request.json();

  if (typeof rating !== "number" || rating < 1 || rating > 5) {
    return NextResponse.json({ error: "Rating must be between 1 and 5" }, { status: 400 });
  }

  const orderId = await findEligibleOrderForReview(session.user.id, productId);
  if (!orderId) {
    return NextResponse.json(
      { error: "You can only review products you've purchased, and only once" },
      { status: 403 }
    );
  }

  const review = await db.orm.public.Review.create({
    productId,
    userId: session.user.id,
    orderId,
    rating,
    comment: comment || undefined,
    status: "PENDING",
  });

  return NextResponse.json(review, { status: 201 });
}
