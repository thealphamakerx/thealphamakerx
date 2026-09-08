"use client";

import { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

export function Gallery({
  images,
  productName,
}: {
  images: { id: string; url: string; alt: string | null }[];
  productName: string;
}) {
  const [selected, setSelected] = useState(0);
  const active = images[selected];

  return (
    <div className="flex flex-col gap-3">
      <div className="relative aspect-4/5 w-full overflow-hidden rounded-2xl bg-muted">
        {active ? (
          <Image
            src={active.url}
            alt={active.alt ?? productName}
            fill
            className="object-cover"
            sizes="(min-width: 1024px) 55vw, 100vw"
            priority
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">
            No image yet
          </div>
        )}
      </div>

      {images.length > 1 && (
        <div className="flex gap-2">
          {images.map((image, i) => (
            <button
              key={image.id}
              type="button"
              onClick={() => setSelected(i)}
              className={cn(
                "relative size-16 shrink-0 overflow-hidden rounded-lg bg-muted ring-1 ring-border",
                i === selected && "ring-2 ring-primary"
              )}
            >
              <Image
                src={image.url}
                alt={image.alt ?? productName}
                fill
                className="object-cover"
                sizes="64px"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
