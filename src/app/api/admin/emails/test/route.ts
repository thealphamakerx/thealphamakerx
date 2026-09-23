import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAdminSession } from "@/lib/admin-auth";
import { emailSettingsSchema, sendTestEmail } from "@/lib/emails";
import { EMAIL_KINDS, type EmailSettings } from "@/lib/email-templates";

/** Send one template to the signed-in admin, using the (possibly unsaved) settings being edited. */
export async function POST(request: NextRequest) {
  const session = await getAdminSession(request.headers);
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const parsed = z.object({ kind: z.enum(EMAIL_KINDS), settings: emailSettingsSchema.optional() }).safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  try {
    await sendTestEmail(parsed.data.kind, session.user.email, parsed.data.settings as EmailSettings | undefined);
    return NextResponse.json({ ok: true, to: session.user.email });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Couldn't send" }, { status: 502 });
  }
}
