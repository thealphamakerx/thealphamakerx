"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { Eye, FileDown, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import {
  contentTypeFor,
  formatBytes,
  PRODUCT_FILE_KINDS,
  type ProductFileKind,
} from "@/lib/product-file-kinds";

export type AdminProductFile = { name: string; size: number | null; uploadedAt: string | null };

/** PUT straight to R2, reporting progress (fetch can't). */
function putFile(
  url: string,
  file: File,
  headers: Record<string, string>,
  onProgress: (percent: number) => void
) {
  return new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    // Exactly the headers the URL was signed with.
    for (const [name, value] of Object.entries(headers)) xhr.setRequestHeader(name, value);
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress(Math.round((event.loaded / event.total) * 100));
    };
    xhr.onload = () =>
      xhr.status >= 200 && xhr.status < 300
        ? resolve()
        : reject(new Error(`Storage rejected the upload (HTTP ${xhr.status})`));
    // A CORS rejection surfaces as a bare network error.
    xhr.onerror = () => reject(new Error("Network error during upload — check the R2 bucket's CORS policy"));
    xhr.send(file);
  });
}

type Status = { state: "idle" } | { state: "uploading"; progress: number } | { state: "failed"; error: string };

/** One R2-stored file slot on a product: status, details, upload/replace, delete. */
function FileSlot({
  productId,
  kind,
  file,
  hint,
  deleteWarning,
}: {
  productId: string;
  kind: ProductFileKind;
  file: AdminProductFile | null;
  hint: string;
  deleteWarning?: string;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<Status>({ state: "idle" });
  const [deleting, setDeleting] = useState(false);
  const spec = PRODUCT_FILE_KINDS[kind];
  const accept = [...new Set(Object.values(spec.contentTypes))].map((ext) => `.${ext}`).join(",");
  const busy = status.state === "uploading" || deleting;

  async function upload(picked: File) {
    if (picked.size > spec.maxBytes) {
      setStatus({ state: "failed", error: `File is too large (max ${formatBytes(spec.maxBytes)})` });
      return;
    }

    setStatus({ state: "uploading", progress: 0 });
    // Closing the tab mid-upload would silently abandon a large file.
    const warnOnLeave = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warnOnLeave);

    try {
      const startRes = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId,
          kind,
          contentType: contentTypeFor(kind, picked),
          size: picked.size,
          fileName: picked.name,
        }),
      });
      const start = await startRes.json().catch(() => null);
      if (!startRes.ok || !start?.uploadUrl) throw new Error(start?.error ?? "Could not start upload");

      await putFile(start.uploadUrl, picked, start.headers, (progress) => setStatus({ state: "uploading", progress }));

      const completeRes = await fetch("/api/upload/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, kind, key: start.key, fileName: picked.name }),
      });
      const complete = await completeRes.json().catch(() => null);
      if (!completeRes.ok) throw new Error(complete?.error ?? "Could not save upload");

      setStatus({ state: "idle" });
      toast.add({ title: `Uploaded "${picked.name}"`, type: "success" });
      router.refresh();
    } catch (error) {
      setStatus({ state: "failed", error: error instanceof Error ? error.message : "Upload failed" });
    } finally {
      window.removeEventListener("beforeunload", warnOnLeave);
    }
  }

  async function remove() {
    if (!file) return;
    const warning = deleteWarning ? `\n\n${deleteWarning}` : "";
    if (!confirm(`Delete “${file.name}” from storage? This can't be undone.${warning}`)) return;
    setDeleting(true);
    const res = await fetch(`/api/upload?productId=${encodeURIComponent(productId)}&kind=${kind}`, { method: "DELETE" });
    const data = await res.json().catch(() => ({}));
    setDeleting(false);
    if (!res.ok) {
      toast.add({ title: data.error ?? "Couldn't delete the file", type: "error" });
      return;
    }
    toast.add({ title: `Deleted "${file.name}"`, type: "success" });
    router.refresh();
  }

  const pill =
    status.state === "uploading"
      ? { text: `Uploading ${status.progress}%`, tone: "bg-primary/15 text-primary" }
      : status.state === "failed"
        ? { text: "Upload failed", tone: "bg-destructive/15 text-destructive" }
        : file
          ? { text: "Uploaded", tone: "bg-success/15 text-success" }
          : { text: "No file", tone: "bg-muted text-muted-foreground" };

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-border p-3">
      <div className="flex flex-wrap items-center gap-3">
        <FileDown className="size-5 shrink-0 text-muted-foreground" aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium">{spec.label}</span>
            <span className={cn("rounded-full px-2 py-0.5 text-[11px]", pill.tone)}>{pill.text}</span>
          </div>
          <p className="text-xs text-muted-foreground">{hint}</p>
        </div>
        <div className="flex gap-2">
          <Button type="button" size="sm" variant="outline" disabled={busy} onClick={() => inputRef.current?.click()}>
            <Upload className="size-3.5" />
            {file ? "Replace" : "Upload"}
          </Button>
          {file && (
            <Button type="button" size="sm" variant="outline" className="text-destructive" disabled={busy} onClick={remove} aria-label={`Delete ${spec.label.toLowerCase()}`}>
              <Trash2 className="size-3.5" />
            </Button>
          )}
        </div>
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          disabled={busy}
          className="hidden"
          onChange={(e) => {
            const picked = e.target.files?.[0];
            e.target.value = "";
            if (picked) void upload(picked);
          }}
        />
      </div>

      {status.state === "uploading" && (
        <div className="h-1.5 overflow-hidden rounded-full bg-muted" role="progressbar" aria-valuenow={status.progress} aria-valuemin={0} aria-valuemax={100}>
          <div className="h-full bg-primary transition-[width]" style={{ width: `${status.progress}%` }} />
        </div>
      )}
      {status.state === "failed" && <p className="text-xs text-destructive">{status.error}</p>}

      {file && (
        <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 rounded-lg bg-muted/50 px-3 py-2 text-xs">
          <dt className="text-muted-foreground">File</dt>
          <dd className="truncate font-medium" title={file.name}>{file.name}</dd>
          <dt className="text-muted-foreground">Size</dt>
          <dd>{file.size !== null ? formatBytes(file.size) : "—"}</dd>
          <dt className="text-muted-foreground">Uploaded</dt>
          <dd>{file.uploadedAt ? format(new Date(file.uploadedAt), "d MMM yyyy, h:mm a") : "—"}</dd>
        </dl>
      )}
    </div>
  );
}

/** The files a product carries in private R2 storage, plus the external-link fallback. */
export function ProductFileField({
  id,
  downloadFile,
  previewFile,
  paidOrders,
  digitalAccessUrl,
  onLinkChange,
}: {
  id: string;
  downloadFile: AdminProductFile | null;
  previewFile: AdminProductFile | null;
  paidOrders: number;
  digitalAccessUrl: string;
  onLinkChange: (url: string) => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      <FileSlot
        productId={id}
        kind="download"
        file={downloadFile}
        hint="PDF, EPUB, ZIP, Excel or CSV · up to 500 MB · private, only buyers get a 15-minute link"
        deleteWarning={
          paidOrders > 0
            ? `${paidOrders} buyer${paidOrders === 1 ? " has" : "s have"} paid for this product and will lose their download until you upload a new file.`
            : undefined
        }
      />
      <FileSlot
        productId={id}
        kind="preview"
        file={previewFile}
        hint="Optional free sample · PDF or image · up to 50 MB · anyone can open it from the product page"
      />
      {previewFile && (
        <a href={`/api/preview/${id}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 self-start text-xs text-primary hover:underline">
          <Eye className="size-3.5" /> Open preview
        </a>
      )}
      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-medium">Or an external download link (used when no product file is uploaded)</span>
        <input
          type="url"
          value={digitalAccessUrl}
          onChange={(e) => onLinkChange(e.target.value)}
          placeholder="https://drive.google.com/…"
          className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40"
        />
      </label>
    </div>
  );
}
