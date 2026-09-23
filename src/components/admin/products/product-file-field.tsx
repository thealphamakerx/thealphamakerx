"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { FileDown, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";

// Mirrors MAX_UPLOAD_BYTES in lib/storage (server-only module); the server
// re-checks both before signing and after the upload lands.
const MAX_UPLOAD_BYTES = 500 * 1024 * 1024;

/** PUT straight to object storage, reporting progress (fetch can't). */
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
    xhr.onerror = () => reject(new Error("Network error during upload"));
    xhr.send(file);
  });
}

/** The file buyers download: upload to private object storage, or link to an external file. */
export function ProductFileField({
  id,
  digitalFileName,
  digitalAccessUrl,
  onLinkChange,
}: {
  id: string;
  digitalFileName: string | null;
  digitalAccessUrl: string;
  onLinkChange: (url: string) => void;
}) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (!file) return;

    // Some OSes report no MIME type for .zip/.xlsx — fall back to the extension.
    const EXTENSION_TYPES: Record<string, string> = {
      xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      xlsm: "application/vnd.ms-excel.sheet.macroEnabled.12",
      xls: "application/vnd.ms-excel",
      csv: "text/csv",
      pdf: "application/pdf",
      zip: "application/zip",
    };
    const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
    const contentType = file.type || EXTENSION_TYPES[extension] || "";

    if (file.size > MAX_UPLOAD_BYTES) {
      toast.add({ title: "Upload failed", description: "File is too large (max 500MB)", type: "error" });
      return;
    }

    setUploading(true);
    setProgress(0);
    // Closing the tab mid-upload would silently abandon a large file.
    const warnOnLeave = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warnOnLeave);

    try {
      const startRes = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: id, contentType, size: file.size, fileName: file.name }),
      });
      const start = await startRes.json().catch(() => null);
      if (!startRes.ok || !start?.uploadUrl) {
        throw new Error(start?.error ?? "Could not start upload");
      }

      await putFile(start.uploadUrl, file, start.headers, setProgress);

      const completeRes = await fetch("/api/upload/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: id, key: start.key, fileName: file.name }),
      });
      const complete = await completeRes.json().catch(() => null);
      if (!completeRes.ok) {
        throw new Error(complete?.error ?? "Could not save upload");
      }

      toast.add({ title: `Uploaded "${file.name}"`, type: "success" });
      router.refresh();
    } catch (error) {
      toast.add({
        title: "Upload failed",
        description: error instanceof Error ? error.message : undefined,
        type: "error",
      });
    } finally {
      window.removeEventListener("beforeunload", warnOnLeave);
      setUploading(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border p-3">
        <FileDown className="size-5 shrink-0 text-muted-foreground" aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{digitalFileName ?? "No file uploaded"}</p>
          <p className="text-xs text-muted-foreground">PDF, ZIP, Excel or CSV · up to 500 MB · private, served only to buyers</p>
        </div>
        <Button type="button" size="sm" variant="outline" disabled={uploading} onClick={() => fileInputRef.current?.click()}>
          <Upload className="size-3.5" />
          {uploading ? `Uploading… ${progress}%` : digitalFileName ? "Replace file" : "Upload file"}
        </Button>
        <input ref={fileInputRef} type="file" accept=".xlsx,.xlsm,.xls,.csv,.pdf,.zip" onChange={handleFileChange} disabled={uploading} className="hidden" />
      </div>
      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-medium">Or an external download link (used when no file is uploaded)</span>
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
