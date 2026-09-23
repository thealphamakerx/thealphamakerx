import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-auth";
import { imageKitConfigured, listMedia } from "@/lib/imagekit";
import { MEDIA_FOLDERS, type MediaFolder } from "@/lib/media";

export async function GET(request: NextRequest) {
  if (!(await getAdminSession(request.headers))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (!imageKitConfigured()) return NextResponse.json({ error: "ImageKit isn't configured." }, { status: 503 });
  const params = request.nextUrl.searchParams;
  const folder = MEDIA_FOLDERS.find((f) => f.key === params.get("folder"))?.key as MediaFolder | undefined;
  const kind = params.get("kind") === "image" ? "image" : params.get("kind") === "video" ? "video" : undefined;
  try {
    const files = await listMedia({ folder, kind, q: params.get("q") ?? undefined });
    return NextResponse.json({ files }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Media list failed", error instanceof Error ? error.message : error);
    return NextResponse.json({ error: "Couldn't load the media library. Check the ImageKit keys." }, { status: 502 });
  }
}
