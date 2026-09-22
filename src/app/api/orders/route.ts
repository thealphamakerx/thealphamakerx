import { auth } from "@/lib/auth";
import { getOrdersForUser } from "@/lib/orders";

// Orders are created only through the validated checkout route. Never accept arbitrary status/amount writes.
export async function GET(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
  return Response.json(await getOrdersForUser(session.user.id), { headers: { "Cache-Control": "no-store" } });
}
