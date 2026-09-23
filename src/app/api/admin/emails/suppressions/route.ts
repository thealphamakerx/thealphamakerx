import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-auth";
import { paymentPool } from "@/lib/payments/pool";

/** Let an address receive reminders again. */
export async function DELETE(request: NextRequest) {
  if (!(await getAdminSession(request.headers))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const email = request.nextUrl.searchParams.get("email");
  if (!email) return NextResponse.json({ error: "Missing email" }, { status: 400 });
  await paymentPool.query(`DELETE FROM public."emailSuppression" WHERE email=lower($1)`, [email]);
  return NextResponse.json({ ok: true });
}
