"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Upload } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/toast";
import { formatPrice } from "@/lib/pricing";

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

export function ProductAccessRow({
  id,
  slug,
  name,
  price,
  isActive,
  digitalAccessUrl,
  digitalFileName,
}: {
  id: string;
  slug: string;
  name: string;
  price: number;
  isActive: boolean;
  digitalAccessUrl: string | null;
  digitalFileName: string | null;
}) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [url, setUrl] = useState(digitalAccessUrl ?? "");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  async function handleSaveUrl() {
    setSaving(true);
    const res = await fetch(`/api/admin/products/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ digitalAccessUrl: url }),
    });
    setSaving(false);

    if (res.ok) {
      toast.add({ title: "Link saved", type: "success" });
    } else {
      toast.add({ title: "Could not save link", type: "error" });
    }
  }

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
    <Card>
      <CardContent className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link href={`/products/${slug}`} target="_blank" className="font-medium hover:underline">
              {name}
            </Link>
            {!isActive && <Badge variant="secondary">Retired</Badge>}
          </div>
          <span className="font-medium">{formatPrice(price)}</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={uploading}
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="size-3.5" />
            {uploading ? `Uploading… ${progress}%` : "Upload .xlsx / .zip (max 500MB)"}
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xlsm,.xls,.csv,.pdf,.zip"
            onChange={handleFileChange}
            disabled={uploading}
            className="hidden"
          />
          {digitalFileName && (
            <Badge variant="secondary">{digitalFileName}</Badge>
          )}
        </div>

        <div className="flex gap-2">
          <Input
            placeholder="Or paste an external link (Google Sheets, Drive, Gumroad, etc.)"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="h-8 text-xs"
          />
          <Button type="button" size="sm" variant="outline" disabled={saving} onClick={handleSaveUrl}>
            {saving ? "Saving…" : "Save"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
