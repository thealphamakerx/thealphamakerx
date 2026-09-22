import { z } from "zod";
import { sendContactEmail } from "@/lib/email";
import { getClientIp, rateLimit } from "@/lib/rate-limit";

const contactSchema = z.object({
  name: z.string().trim().min(1).max(100),
  email: z.string().trim().email().max(254),
  message: z.string().trim().min(10).max(5000),
  website: z.string().max(200).optional(),
});

export async function POST(request: Request) {
  const limit = rateLimit(`contact:${getClientIp(request)}`, { windowMs: 60_000, max: 3 });
  if (!limit.allowed) {
    return Response.json({ error: "Please wait a minute before sending another message." }, { status: 429 });
  }

  const data = contactSchema.safeParse(await request.json().catch(() => null));
  if (!data.success) {
    return Response.json({ error: "Enter your name, a valid email, and a message of 10–5,000 characters." }, { status: 400 });
  }
  if (data.data.website) return Response.json({ success: true });

  try {
    await sendContactEmail(data.data);
    return Response.json({ success: true });
  } catch {
    return Response.json({ error: "We couldn’t send your message. Please try again later or use the email address above." }, { status: 503 });
  }
}
