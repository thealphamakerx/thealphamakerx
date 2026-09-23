import { NextRequest, NextResponse } from "next/server";
import { siteConfig } from "@/config/site";
import { suppressEmail, verifyUnsubscribeToken } from "@/lib/emails";

// Unsubscribes an address from reminder emails (receipts still arrive).
// GET is the link in the email; POST is RFC 8058 one-click from the mail app.

async function unsubscribe(request: NextRequest) {
  const email = request.nextUrl.searchParams.get("e") ?? "";
  const token = request.nextUrl.searchParams.get("t") ?? "";
  if (!email || !token || !verifyUnsubscribeToken(email, token)) return false;
  await suppressEmail(email, "unsubscribed");
  return true;
}

export async function POST(request: NextRequest) {
  return new NextResponse(null, { status: (await unsubscribe(request)) ? 200 : 400 });
}

export async function GET(request: NextRequest) {
  const ok = await unsubscribe(request);
  const message = ok
    ? "You're unsubscribed from reminder emails. You'll still get receipts and download links for anything you buy."
    : "This unsubscribe link isn't valid. Please use the link from your most recent email.";
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Email preferences</title></head>
<body style="margin:0;background:#0f0a0b;color:#f5f0f0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;display:grid;place-items:center;min-height:100vh;padding:24px">
<main style="max-width:420px;text-align:center"><h1 style="font-size:22px;margin:0 0 12px">${ok ? "Unsubscribed" : "Link not valid"}</h1>
<p style="color:#bdb3b4;line-height:1.6;margin:0 0 20px">${message}</p>
<a href="${siteConfig.url}" style="color:#db423f">Back to ${siteConfig.name}</a></main></body></html>`;
  return new NextResponse(html, { status: ok ? 200 : 400, headers: { "Content-Type": "text/html; charset=utf-8" } });
}
