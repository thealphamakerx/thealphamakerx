import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAdminSession } from "@/lib/admin-auth";
import { offerSchema } from "@/lib/validations/offer";
import { isUniqueViolation, saveOffer } from "@/lib/admin-offers";

export async function PATCH(request: NextRequest, { params }: RouteContext<"/api/admin/offers/[id]">) {
  if (!(await getAdminSession(request.headers))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  const parsed = offerSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid combo" }, { status: 400 });
  try {
    const saved = await saveOffer(parsed.data, id);
    if (!saved) return NextResponse.json({ error: "Combo not found" }, { status: 404 });
    return NextResponse.json({ id: saved });
  } catch (error) {
    if (isUniqueViolation(error)) return NextResponse.json({ error: "That URL slug is already used by another combo." }, { status: 409 });
    throw error;
  }
}

// Past orders keep their own snapshot (orderItem.offerName), so a combo can be deleted safely.
export async function DELETE(request: NextRequest, { params }: RouteContext<"/api/admin/offers/[id]">) {
  if (!(await getAdminSession(request.headers))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  await db.orm.public.Offer.where({ id }).delete();
  return NextResponse.json({ ok: true });
}
