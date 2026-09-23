"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import {
  DEFAULT_TEMPLATES,
  EMAIL_INFO,
  EMAIL_KINDS,
  SAMPLE_VARS,
  renderEmail,
  templateFor,
  type EmailBrand,
  type EmailKind,
  type EmailSettings,
  type TemplateText,
} from "@/lib/email-templates";
import { Field, TextArea, TextInput } from "./form-fields";

const CATEGORY_LABEL = { transactional: "Receipt", nudge: "Reminder", admin: "To you" } as const;

/** Edit every order email with a live preview, send tests, and set reminder timing. */
export function EmailTemplatesEditor({ initial, brand }: { initial: EmailSettings; brand: EmailBrand }) {
  const router = useRouter();
  const [settings, setSettings] = useState(initial);
  const [kind, setKind] = useState<EmailKind>("PAID");
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [dirty, setDirty] = useState(false);

  const template = templateFor(settings, kind);
  const override = settings.templates[kind] ?? {};
  const preview = useMemo(
    () => renderEmail(kind, { ...template, enabled: true }, { ...SAMPLE_VARS, unsubscribeUrl: EMAIL_INFO[kind].category === "nudge" ? "#" : undefined }, brand),
    [kind, template, brand]
  );

  function update(patch: Partial<TemplateText>) {
    setSettings((s) => ({ ...s, templates: { ...s.templates, [kind]: { ...s.templates[kind], ...patch } } }));
    setDirty(true);
  }

  async function save() {
    setSaving(true);
    const res = await fetch("/api/admin/emails/settings", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(settings) });
    setSaving(false);
    if (!res.ok) { toast.add({ title: "Couldn't save email settings", type: "error" }); return; }
    setDirty(false);
    toast.add({ title: "Email settings saved", type: "success" });
    router.refresh();
  }

  async function sendTest() {
    setTesting(true);
    const res = await fetch("/api/admin/emails/test", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ kind, settings }) });
    const data = await res.json().catch(() => ({}));
    setTesting(false);
    if (!res.ok) { toast.add({ title: "Test not sent", description: data.error, type: "error" }); return; }
    toast.add({ title: `Test sent to ${data.to}`, type: "success" });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-1 overflow-x-auto border-b border-border" role="tablist" aria-label="Email">
        {EMAIL_KINDS.map((k) => {
          const enabled = templateFor(settings, k).enabled;
          return (
            <button
              key={k}
              type="button"
              role="tab"
              aria-selected={kind === k}
              onClick={() => setKind(k)}
              className={cn(
                "-mb-px flex shrink-0 items-center gap-2 border-b-2 px-3 py-2 text-sm transition-colors",
                kind === k ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              <span className={cn("size-2 rounded-full", enabled ? "bg-success" : "bg-muted-foreground/40")} aria-hidden="true" />
              {EMAIL_INFO[k].name}
            </button>
          );
        })}
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-sm font-medium">{EMAIL_INFO[kind].name} <span className="ml-1 rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">{CATEGORY_LABEL[EMAIL_INFO[kind].category]}</span></p>
              <p className="text-xs text-muted-foreground">Sent: {EMAIL_INFO[kind].when}</p>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={template.enabled} onChange={(e) => update({ enabled: e.target.checked })} className="size-4 accent-[var(--primary)]" />
              Send this email
            </label>
          </div>

          <Field label="Subject">
            <TextInput maxLength={200} value={override.subject ?? ""} placeholder={DEFAULT_TEMPLATES[kind].subject} onChange={(e) => update({ subject: e.target.value })} />
          </Field>
          <Field label="Heading">
            <TextInput maxLength={200} value={override.heading ?? ""} placeholder={DEFAULT_TEMPLATES[kind].heading} onChange={(e) => update({ heading: e.target.value })} />
          </Field>
          <Field label="Message" hint="Placeholders: {{product}} {{total}} {{order}} {{email}} {{site}}. Empty fields use the default shown.">
            <TextArea rows={5} maxLength={2000} value={override.body ?? ""} placeholder={DEFAULT_TEMPLATES[kind].body} onChange={(e) => update({ body: e.target.value })} />
          </Field>
          {DEFAULT_TEMPLATES[kind].button && (
            <Field label="Button text">
              <TextInput maxLength={60} value={override.button ?? ""} placeholder={DEFAULT_TEMPLATES[kind].button} onChange={(e) => update({ button: e.target.value || undefined })} />
            </Field>
          )}

          {EMAIL_INFO[kind].category === "nudge" && (
            <div className="grid gap-3 rounded-xl border border-border p-3 sm:grid-cols-3">
              <Field label="Payment failed after (minutes)">
                <TextInput type="number" min={0} max={1440} value={settings.failedDelayMinutes}
                  onChange={(e) => { setSettings((s) => ({ ...s, failedDelayMinutes: Math.max(0, Number(e.target.value) || 0) })); setDirty(true); }} />
              </Field>
              <Field label="Reminder after (hours)">
                <TextInput type="number" min={0.25} step={0.25} value={settings.reminder1Hours}
                  onChange={(e) => { setSettings((s) => ({ ...s, reminder1Hours: Number(e.target.value) || 1 })); setDirty(true); }} />
              </Field>
              <Field label="Final reminder after (hours)">
                <TextInput type="number" min={0.5} step={0.5} value={settings.reminder2Hours}
                  onChange={(e) => { setSettings((s) => ({ ...s, reminder2Hours: Number(e.target.value) || 24 })); setDirty(true); }} />
              </Field>
              <p className="text-xs text-muted-foreground sm:col-span-3">
                Reminders go only to the buyer&apos;s latest unpaid checkout, stop the moment they pay, and never go to anyone who unsubscribed.
              </p>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <Button onClick={save} disabled={saving || !dirty}>{saving ? "Saving…" : "Save all emails"}</Button>
            <Button variant="outline" onClick={sendTest} disabled={testing}><Send className="size-4" /> {testing ? "Sending…" : "Send test to me"}</Button>
            {dirty && <span className="self-center text-xs text-muted-foreground">Unsaved changes</span>}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <p className="text-xs text-muted-foreground">
            Preview with sample order · <span className="text-foreground">Subject:</span> {preview.subject}
          </p>
          <iframe title="Email preview" srcDoc={preview.html} sandbox="" className="h-[640px] w-full rounded-2xl border border-border bg-white" />
        </div>
      </div>
    </div>
  );
}
