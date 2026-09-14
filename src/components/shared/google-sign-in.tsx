"use client";

import { useEffect, useRef, useState } from "react";
import { authClient, signIn } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";

/**
 * "Continue with Google" button, plus (with `oneTap`) Google's One Tap
 * prompt, which detects the Google account already signed in to the browser
 * and offers "Continue as you@gmail.com" — no typing. Both land back on
 * `callbackURL` with a session. Render only when isGoogleSignInEnabled.
 */
export function GoogleSignIn({
  callbackURL,
  oneTap = false,
}: {
  callbackURL: string;
  oneTap?: boolean;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const promptedRef = useRef(false);

  useEffect(() => {
    if (!oneTap || promptedRef.current) return;
    promptedRef.current = true;

    // One Tap is best-effort: the browser may block third-party sign-in or
    // the customer may have dismissed it before — the button still works.
    authClient.oneTap({ callbackURL, context: "use" }).catch(() => {});
  }, [oneTap, callbackURL]);

  async function handleClick() {
    setError(null);
    setLoading(true);

    const { error: signInError } = await signIn.social({ provider: "google", callbackURL });

    // On success the browser is already navigating to Google.
    if (signInError) {
      setLoading(false);
      setError(signInError.message ?? "Google sign-in failed");
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <Button type="button" variant="outline" size="lg" disabled={loading} onClick={handleClick}>
        <GoogleLogo />
        {loading ? "Redirecting…" : "Continue with Google"}
      </Button>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

function GoogleLogo() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.1A6.6 6.6 0 0 1 5.5 12c0-.73.13-1.44.34-2.1V7.06H2.18A11 11 0 0 0 1 12c0 1.78.43 3.45 1.18 4.94l3.66-2.84z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
      />
    </svg>
  );
}
