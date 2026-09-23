"use client";

import { useEffect, useState } from "react";

/** Time left until a real offer deadline set in admin. Renders nothing once it has passed. */
export function Countdown({ endsAt, className }: { endsAt: string; className?: string }) {
  const end = Date.parse(endsAt);
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- start the clock after hydration to avoid a server/client mismatch
    setNow(Date.now());
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  if (now === null || Number.isNaN(end) || end <= now) return null;

  const left = Math.floor((end - now) / 1000);
  const parts = [
    { label: "days", value: Math.floor(left / 86400) },
    { label: "hrs", value: Math.floor((left % 86400) / 3600) },
    { label: "min", value: Math.floor((left % 3600) / 60) },
    { label: "sec", value: left % 60 },
  ].filter((p, i) => i > 0 || p.value > 0);

  return (
    <span className={className} role="timer" aria-live="off">
      {parts.map((p) => (
        <span key={p.label} className="inline-flex items-baseline gap-0.5 tabular-nums">
          <span className="font-semibold">{String(p.value).padStart(2, "0")}</span>
          <span className="text-[0.75em] opacity-80">{p.label}</span>
        </span>
      ))}
    </span>
  );
}
