"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RotateCw, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";

export function ResendEmailButton({ id }: { id: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  return (
    <button
      type="button"
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        const res = await fetch(`/api/admin/emails/${encodeURIComponent(id)}/resend`, { method: "POST" });
        setBusy(false);
        if (!res.ok) { toast.add({ title: "Couldn't resend", type: "error" }); return; }
        toast.add({ title: "Queued to send again", type: "success" });
        router.refresh();
      }}
      className="inline-flex items-center gap-1 rounded-lg border border-border px-2 py-1 text-xs hover:bg-secondary/40 disabled:opacity-50"
    >
      <RotateCw className="size-3" /> Resend
    </button>
  );
}

export function UnsuppressButton({ email }: { email: string }) {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={async () => {
        if (!confirm(`Send reminders to ${email} again?`)) return;
        const res = await fetch(`/api/admin/emails/suppressions?email=${encodeURIComponent(email)}`, { method: "DELETE" });
        if (!res.ok) { toast.add({ title: "Couldn't update", type: "error" }); return; }
        router.refresh();
      }}
      className="text-xs text-muted-foreground underline hover:text-foreground"
    >
      Allow again
    </button>
  );
}

export function DeliverNowButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  return (
    <Button
      variant="outline"
      size="sm"
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        const res = await fetch("/api/admin/emails/deliver", { method: "POST" });
        const data = await res.json().catch(() => ({}));
        setBusy(false);
        if (!res.ok) { toast.add({ title: "Couldn't send", type: "error" }); return; }
        toast.add({ title: `Sent ${data.sent} · queued ${data.reminders} reminder${data.reminders === 1 ? "" : "s"}`, type: "success" });
        router.refresh();
      }}
    >
      <Send className="size-4" /> {busy ? "Sending…" : "Send due emails now"}
    </Button>
  );
}
