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

export function ProductAccessRow({
  id,
  slug,
  name,
  price,
  digitalAccessUrl,
  digitalFileName,
}: {
  id: string;
  slug: string;
  name: string;
  price: number;
  digitalAccessUrl: string | null;
  digitalFileName: string | null;
}) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [url, setUrl] = useState(digitalAccessUrl ?? "");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

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
    if (!file) return;

    setUploading(true);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("productId", id);

    const res = await fetch("/api/upload", { method: "POST", body: formData });

    setUploading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      toast.add({ title: "Upload failed", description: data?.error, type: "error" });
      return;
    }

    if (fileInputRef.current) fileInputRef.current.value = "";
    toast.add({ title: `Uploaded "${file.name}"`, type: "success" });
    router.refresh();
  }

  return (
    <Card>
      <CardContent className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <Link href={`/products/${slug}`} target="_blank" className="font-medium hover:underline">
            {name}
          </Link>
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
            {uploading ? "Uploading…" : "Upload PDF/ZIP"}
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.zip,application/pdf,application/zip"
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
            placeholder="Or paste an external link (Google Drive, Gumroad, etc.)"
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
