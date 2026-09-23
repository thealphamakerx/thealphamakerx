import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-auth";
import { emailSettingsSchema, saveEmailSettings } from "@/lib/emails";
import type { EmailSettings } from "@/lib/email-templates";

export async function PUT(request: NextRequest) {
  if (!(await getAdminSession(request.headers))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const parsed = emailSettingsSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid email settings" }, { status: 400 });
  await saveEmailSettings(parsed.data as EmailSettings);
  return NextResponse.json({ ok: true });
}
