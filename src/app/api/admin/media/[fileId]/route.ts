import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-auth";
import { deleteMedia, imageKitConfigured } from "@/lib/imagekit";

export async function DELETE(request: NextRequest, { params }: RouteContext<"/api/admin/media/[fileId]">) {
  if (!(await getAdminSession(request.headers))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (!imageKitConfigured()) return NextResponse.json({ error: "ImageKit isn't configured." }, { status: 503 });
  const { fileId } = await params;
  if (!/^[a-zA-Z0-9_-]{1,64}$/.test(fileId)) return NextResponse.json({ error: "Invalid file" }, { status: 400 });
  try {
    await deleteMedia(fileId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Media delete failed", error instanceof Error ? error.message : error);
    return NextResponse.json({ error: "Couldn't delete the file." }, { status: 502 });
  }
}
