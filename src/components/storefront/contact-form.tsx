"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function ContactForm() {
  const [pending, setPending] = useState(false);
  const [status, setStatus] = useState("");
  const [failed, setFailed] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setPending(true);
    setStatus("");
    setFailed(false);
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(Object.fromEntries(new FormData(form))),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Unable to send your message. Please try again or email us.");
      setStatus("Your message has been sent. We usually reply within 24 hours.");
      form.reset();
    } catch (error) {
      setFailed(true);
      setStatus(error instanceof Error ? error.message : "Unable to send your message. Please email us.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={submit} className="mt-8 space-y-5 rounded-2xl border border-border p-6">
      <h2 className="text-xl font-semibold">Send us a message</h2>
      <fieldset disabled={pending} className="space-y-5">
        <div className="space-y-2">
          <label htmlFor="contact-name" className="text-sm font-medium">Name</label>
          <Input id="contact-name" name="name" autoComplete="name" required maxLength={100} />
        </div>
        <div className="space-y-2">
          <label htmlFor="contact-email" className="text-sm font-medium">Email</label>
          <Input id="contact-email" name="email" type="email" autoComplete="email" required maxLength={254} />
        </div>
        <div className="space-y-2">
          <label htmlFor="contact-message" className="text-sm font-medium">Message</label>
          <textarea id="contact-message" name="message" required minLength={10} maxLength={5000} rows={6}
            className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            placeholder="How can we help? Include your order ID if this is about a purchase." />
        </div>
        <div hidden aria-hidden="true">
          <label htmlFor="contact-website">Website</label>
          <input id="contact-website" name="website" tabIndex={-1} autoComplete="off" />
        </div>
        <Button type="submit" disabled={pending}>{pending ? "Sending…" : "Send message"}</Button>
      </fieldset>
      {status && <p role={failed ? "alert" : "status"} className={`text-sm ${failed ? "text-destructive" : "text-muted-foreground"}`}>{status}</p>}
    </form>
  );
}
