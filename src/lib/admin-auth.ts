import { auth } from "@/lib/auth";

/** The signed-in admin's session, or null for anyone else. */
export async function getAdminSession(headers: Headers) {
  const session = await auth.api.getSession({ headers });
  return session && (session.user as { role?: string }).role === "ADMIN" ? session : null;
}
