import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-auth";
import { imageKitConfigured, uploadAuth } from "@/lib/imagekit";

/** Signed, short-lived credentials for one browser upload straight to ImageKit. */
export async function GET(request: NextRequest) {
  if (!(await getAdminSession(request.headers))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (!imageKitConfigured()) return NextResponse.json({ error: "ImageKit isn't configured. Add the IMAGEKIT keys to the environment." }, { status: 503 });
  return NextResponse.json(uploadAuth(), { headers: { "Cache-Control": "no-store" } });
}
