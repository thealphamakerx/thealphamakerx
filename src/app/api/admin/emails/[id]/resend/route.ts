import { NextRequest, NextResponse, after } from "next/server";
import { getAdminSession } from "@/lib/admin-auth";
import { deliverEmails, resendEmail } from "@/lib/emails";

export async function POST(request: NextRequest, { params }: RouteContext<"/api/admin/emails/[id]/resend">) {
  if (!(await getAdminSession(request.headers))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  const copy = await resendEmail(decodeURIComponent(id));
  if (!copy) return NextResponse.json({ error: "Email not found" }, { status: 404 });
  after(() => deliverEmails(3));
  return NextResponse.json({ id: copy });
}
