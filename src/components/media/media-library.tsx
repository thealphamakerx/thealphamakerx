"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Copy, FileVideo, Loader2, Search, Trash2, Upload } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { MEDIA_FOLDERS, MEDIA_ROOT, withTransform, type MediaFolder } from "@/lib/media";
import type { MediaFile } from "@/lib/imagekit";

export type MediaKind = "image" | "video";

const MAX_BYTES = { image: 25 * 1024 * 1024, video: 200 * 1024 * 1024 };

/** Straight from the browser to ImageKit with signed, single-use credentials. */
function uploadFile(file: File, folder: MediaFolder, onProgress: (percent: number) => void) {
  return new Promise<MediaFile>((resolve, reject) => {
    fetch("/api/admin/media/auth", { cache: "no-store" })
      .then(async (res) => {
        const auth = await res.json();
        if (!res.ok) throw new Error(auth.error ?? "Upload not authorised");
        const form = new FormData();
        form.append("file", file);
        form.append("fileName", file.name);
        form.append("folder", `${MEDIA_ROOT}/${folder}`);
        form.append("useUniqueFileName", "true");
        form.append("publicKey", auth.publicKey);
        form.append("signature", auth.signature);
        form.append("expire", String(auth.expire));
        form.append("token", auth.token);

        const xhr = new XMLHttpRequest();
        xhr.open("POST", "https://upload.imagekit.io/api/v1/files/upload");
        xhr.upload.onprogress = (e) => e.lengthComputable && onProgress(Math.round((e.loaded / e.total) * 100));
        xhr.onload = () => {
          const body = JSON.parse(xhr.responseText || "{}");
          if (xhr.status < 200 || xhr.status >= 300) return reject(new Error(body.message ?? `Upload failed (${xhr.status})`));
          resolve({
            fileId: body.fileId, name: body.name, url: body.url, thumbnail: body.thumbnailUrl ?? null,
            kind: body.fileType === "image" ? "image" : file.type.startsWith("video/") ? "video" : "file",
            folder, size: body.size, width: body.width ?? null, height: body.height ?? null, createdAt: new Date().toISOString(),
          });
        };
        xhr.onerror = () => reject(new Error("Network error during upload"));
        xhr.send(form);
      })
      .catch(reject);
  });
}

const formatSize = (bytes: number) =>
  bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;

/**
 * Browse, upload and delete media on ImageKit. In picker mode (`onSelect`)
 * clicking a file chooses it; `accept` narrows what can be uploaded and shown.
 */
export function MediaLibrary({
  onSelect,
  accept,
  initialFolder = "general",
}: {
  onSelect?: (file: MediaFile) => void;
  accept?: MediaKind;
  initialFolder?: MediaFolder;
}) {
  const [folder, setFolder] = useState<MediaFolder | "all">(initialFolder);
  const [kind, setKind] = useState<MediaKind | "all">(accept ?? "all");
  const [q, setQ] = useState("");
  const [files, setFiles] = useState<MediaFile[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploads, setUploads] = useState<{ name: string; progress: number }[]>([]);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setError(null);
    const params = new URLSearchParams();
    if (folder !== "all") params.set("folder", folder);
    if (kind !== "all") params.set("kind", kind);
    if (q.trim()) params.set("q", q.trim());
    const res = await fetch(`/api/admin/media?${params}`, { cache: "no-store" }).catch(() => null);
    const data = await res?.json().catch(() => null);
    if (!res?.ok) { setError(data?.error ?? "Couldn't load media."); setFiles([]); return; }
    setFiles(data.files);
  }, [folder, kind, q]);

  useEffect(() => {
    const timer = setTimeout(load, q ? 300 : 0);
    return () => clearTimeout(timer);
  }, [load, q]);

  async function handleFiles(list: FileList | File[]) {
    const target: MediaFolder = folder === "all" ? "general" : folder;
    for (const file of Array.from(list)) {
      const fileKind: MediaKind | null = file.type.startsWith("image/") ? "image" : file.type.startsWith("video/") ? "video" : null;
      if (!fileKind || (accept && fileKind !== accept)) {
        toast.add({ title: `${file.name}: ${accept ? `only ${accept}s here` : "only images and videos"}`, type: "error" });
        continue;
      }
      if (file.size > MAX_BYTES[fileKind]) {
        toast.add({ title: `${file.name} is too large`, description: `Max ${formatSize(MAX_BYTES[fileKind])}`, type: "error" });
        continue;
      }
      setUploads((u) => [...u, { name: file.name, progress: 0 }]);
      try {
        const uploaded = await uploadFile(file, target, (progress) =>
          setUploads((u) => u.map((x) => (x.name === file.name ? { ...x, progress } : x)))
        );
        setFiles((f) => [uploaded, ...(f ?? [])]);
        toast.add({ title: `Uploaded ${file.name}`, type: "success" });
        if (onSelect && list.length === 1) onSelect(uploaded);
      } catch (e) {
        toast.add({ title: `Upload failed: ${file.name}`, description: e instanceof Error ? e.message : undefined, type: "error" });
      } finally {
        setUploads((u) => u.filter((x) => x.name !== file.name));
      }
    }
  }

  async function remove(file: MediaFile) {
    if (!confirm(`Delete ${file.name}? Pages still using its link will show a broken image.`)) return;
    const res = await fetch(`/api/admin/media/${file.fileId}`, { method: "DELETE" });
    if (!res.ok) { toast.add({ title: "Couldn't delete the file", type: "error" }); return; }
    setFiles((f) => f?.filter((x) => x.fileId !== file.fileId) ?? null);
  }

  async function copy(file: MediaFile) {
    await navigator.clipboard.writeText(file.url).catch(() => {});
    toast.add({ title: "Link copied", type: "success" });
  }

  const control = "h-9 rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40";

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-wrap gap-1" role="group" aria-label="Folder">
          {[{ key: "all" as const, label: "All" }, ...MEDIA_FOLDERS].map((f) => (
            <button
              key={f.key}
              type="button"
              aria-pressed={folder === f.key}
              onClick={() => setFolder(f.key)}
              className={cn("h-9 rounded-lg border px-3 text-xs font-medium", folder === f.key ? "border-primary bg-accent text-accent-foreground" : "border-border text-muted-foreground hover:text-foreground")}
            >
              {f.label}
            </button>
          ))}
        </div>
        {!accept && (
          <select value={kind} onChange={(e) => setKind(e.target.value as MediaKind | "all")} className={control} aria-label="Type">
            <option value="all">Images &amp; videos</option>
            <option value="image">Images</option>
            <option value="video">Videos</option>
          </select>
        )}
        <label className="relative min-w-48 flex-1">
          <span className="sr-only">Search by file name</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name" className={cn(control, "w-full pl-9")} />
        </label>
      </div>

      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); handleFiles(e.dataTransfer.files); }}
        className={cn("flex flex-col items-center gap-2 rounded-2xl border-2 border-dashed p-6 text-center transition-colors", dragging ? "border-primary bg-accent/30" : "border-border")}
      >
        <Upload className="size-6 text-muted-foreground" aria-hidden="true" />
        <p className="text-sm">
          Drop {accept ? `${accept}s` : "images or videos"} here, or{" "}
          <button type="button" className="font-medium underline" onClick={() => inputRef.current?.click()}>browse</button>
        </p>
        <p className="text-xs text-muted-foreground">
          Uploads to {folder === "all" ? "General" : MEDIA_FOLDERS.find((f) => f.key === folder)?.label} · images up to 25 MB, videos up to 200 MB
        </p>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={accept === "image" ? "image/*" : accept === "video" ? "video/*" : "image/*,video/*"}
          className="hidden"
          onChange={(e) => { if (e.target.files) handleFiles(e.target.files); e.target.value = ""; }}
        />
        {uploads.map((u) => (
          <div key={u.name} className="flex w-full max-w-sm items-center gap-2 text-xs">
            <span className="min-w-0 flex-1 truncate text-left">{u.name}</span>
            <span className="h-1.5 w-24 overflow-hidden rounded-full bg-muted"><span className="block h-full bg-chart" style={{ width: `${u.progress}%` }} /></span>
            <span className="w-8 tabular-nums">{u.progress}%</span>
          </div>
        ))}
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {files === null ? (
        <p className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground"><Loader2 className="size-4 animate-spin" /> Loading…</p>
      ) : files.length === 0 && !error ? (
        <p className="py-8 text-center text-sm text-muted-foreground">Nothing here yet.</p>
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {files.map((file) => (
            <li key={file.fileId} className="group flex flex-col overflow-hidden rounded-xl border border-border bg-card">
              <button
                type="button"
                disabled={!onSelect}
                onClick={() => onSelect?.(file)}
                className={cn("relative aspect-square bg-muted", onSelect && "cursor-pointer hover:opacity-80 focus-visible:ring-2 focus-visible:ring-ring")}
                aria-label={onSelect ? `Choose ${file.name}` : file.name}
              >
                {file.kind === "image" ? (
                  // eslint-disable-next-line @next/next/no-img-element -- ImageKit thumbnail, already sized
                  <img src={withTransform(file.url, "w-300,h-300,c-at_max")} alt="" loading="lazy" className="size-full object-contain" />
                ) : file.kind === "video" ? (
                  <span className="flex size-full flex-col items-center justify-center gap-1 text-muted-foreground">
                    {/* eslint-disable-next-line @next/next/no-img-element -- ImageKit video thumbnail */}
                    <img src={`${file.url.split("?")[0]}/ik-thumbnail.jpg?tr=w-300`} alt="" loading="lazy" className="absolute inset-0 size-full object-cover opacity-70" />
                    <FileVideo className="relative size-8" />
                  </span>
                ) : (
                  <span className="flex size-full items-center justify-center text-xs text-muted-foreground">File</span>
                )}
              </button>
              <div className="flex items-center gap-1 p-2">
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-xs" title={file.name}>{file.name}</span>
                  <span className="block text-[10px] text-muted-foreground">
                    {formatSize(file.size)}{file.width ? ` · ${file.width}×${file.height}` : ""}
                  </span>
                </span>
                <button type="button" onClick={() => copy(file)} className="rounded p-1 text-muted-foreground hover:text-foreground" aria-label={`Copy link to ${file.name}`}>
                  <Copy className="size-3.5" />
                </button>
                {!onSelect && (
                  <button type="button" onClick={() => remove(file)} className="rounded p-1 text-muted-foreground hover:text-destructive" aria-label={`Delete ${file.name}`}>
                    <Trash2 className="size-3.5" />
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {!onSelect && files && files.length > 0 && (
        <p className="text-xs text-muted-foreground">
          Tip: images are served through ImageKit&apos;s CDN and resized automatically for each screen.
        </p>
      )}
      {onSelect && <Button type="button" variant="ghost" size="sm" className="self-start" onClick={load}>Refresh</Button>}
    </div>
  );
}
