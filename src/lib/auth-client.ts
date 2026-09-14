import { createAuthClient } from "better-auth/react";
import { oneTapClient } from "better-auth/client/plugins";

// No baseURL: Better Auth's client falls back to a same-origin relative
// path ("/api/auth") when it's omitted. A hardcoded NEXT_PUBLIC_SITE_URL
// broke sign-out with "Failed to fetch" whenever the dev server didn't
// land on its usual port (e.g. another project already held it) — the
// client kept calling the *configured* port instead of whatever port the
// page was actually being served from.
export const authClient = createAuthClient({
  plugins: [
    oneTapClient({
      // Empty when Google isn't configured; callers check
      // isGoogleSignInEnabled before triggering One Tap.
      clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "",
      // Show the prompt once per visit — don't keep re-prompting someone
      // who dismissed it to type their email instead.
      promptOptions: { maxAttempts: 1 },
    }),
  ],
});

export const isGoogleSignInEnabled = Boolean(process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID);

export const { signIn, signUp, signOut, useSession } = authClient;
