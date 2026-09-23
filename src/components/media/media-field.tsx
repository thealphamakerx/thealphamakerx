"use client";

import { useState } from "react";
import { ImagePlus, Video, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { imageKitEnabled, isVideoUrl, videoPoster, withTransform, type MediaFolder } from "@/lib/media";
import { MediaLibrary, type MediaKind } from "./media-library";

/**
 * A media URL input with a preview and a "Choose" button that opens the
 * ImageKit library (upload or pick). A URL can still be pasted by hand.
 */
export function MediaField({
  value,
  onChange,
  kind,
  folder,
  placeholder,
}: {
  value: string;
  onChange: (url: string) => void;
  kind: MediaKind;
  folder: MediaFolder;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const Icon = kind === "video" ? Video : ImagePlus;

  return (
    <div className="flex items-start gap-3">
      <div className="relative flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-muted">
        {value ? (
          kind === "video" || isVideoUrl(value) ? (
            videoPoster(value)
              // eslint-disable-next-line @next/next/no-img-element -- ImageKit video thumbnail
              ? <img src={`${videoPoster(value)}?tr=w-128`} alt="" className="size-full object-cover" />
              : <Video className="size-5 text-muted-foreground" />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element -- preview of an arbitrary media URL
            <img src={withTransform(value, "w-128,h-128,c-at_max")} alt="" className="size-full object-contain" />
          )
        ) : (
          <Icon className="size-5 text-muted-foreground" aria-hidden="true" />
        )}
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <input
          type="url"
          value={value}
          placeholder={placeholder ?? (kind === "video" ? "Video URL" : "Image URL")}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40"
        />
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setOpen(true)}
            disabled={!imageKitEnabled}
            title={imageKitEnabled ? undefined : "Add the ImageKit keys to the environment to upload"}
          >
            <Icon className="size-4" /> {value ? "Change" : "Upload or choose"}
          </Button>
          {value && (
            <Button type="button" variant="ghost" size="sm" onClick={() => onChange("")}>
              <X className="size-4" /> Remove
            </Button>
          )}
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>Choose {kind === "video" ? "a video" : "an image"}</DialogTitle>
          </DialogHeader>
          {open && (
            <MediaLibrary
              accept={kind}
              initialFolder={folder}
              onSelect={(file) => { onChange(file.url); setOpen(false); }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
