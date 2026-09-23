import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-auth";
import { offerSchema } from "@/lib/validations/offer";
import { isUniqueViolation, saveOffer } from "@/lib/admin-offers";

export async function POST(request: NextRequest) {
  if (!(await getAdminSession(request.headers))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const parsed = offerSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid combo" }, { status: 400 });
  try {
    return NextResponse.json({ id: await saveOffer(parsed.data) }, { status: 201 });
  } catch (error) {
    if (isUniqueViolation(error)) return NextResponse.json({ error: "That URL slug is already used by another combo." }, { status: 409 });
    throw error;
  }
}
