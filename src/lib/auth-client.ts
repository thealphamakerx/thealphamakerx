import { createAuthClient } from "better-auth/react";

// No baseURL: Better Auth's client falls back to a same-origin relative
// path ("/api/auth") when it's omitted. A hardcoded NEXT_PUBLIC_SITE_URL
// broke sign-out with "Failed to fetch" whenever the dev server didn't
// land on its usual port (e.g. another project already held it) — the
// client kept calling the *configured* port instead of whatever port the
// page was actually being served from.
export const authClient = createAuthClient();

export const { signIn, signUp, signOut, useSession } = authClient;
