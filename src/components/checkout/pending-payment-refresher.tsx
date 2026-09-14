"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const POLL_INTERVAL_MS = 3000;
const MAX_POLLS = 20;

/**
 * Re-renders the server confirmation page while the order is still PENDING,
 * so it flips to unlocked as soon as the verify call or webhook lands.
 */
export function PendingPaymentRefresher() {
  const router = useRouter();
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    let polls = 0;
    const id = setInterval(() => {
      polls += 1;
      if (polls > MAX_POLLS) {
        clearInterval(id);
        setTimedOut(true);
        return;
      }
      router.refresh();
    }, POLL_INTERVAL_MS);

    return () => clearInterval(id);
  }, [router]);

  if (timedOut) {
    return (
      <p className="max-w-sm text-sm text-muted-foreground">
        This is taking longer than usual. If money was deducted, your order will be confirmed
        automatically — or{" "}
        <Link href="/contact" className="underline hover:text-foreground">
          contact us
        </Link>{" "}
        with your order number.
      </p>
    );
  }

  return <p className="animate-pulse text-xs text-muted-foreground">Checking payment status…</p>;
}
