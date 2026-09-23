import { imageKitConfigured } from "@/lib/imagekit";
import { MediaLibrary } from "@/components/media/media-library";

export const dynamic = "force-dynamic";

export default function AdminMediaPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Media</h1>
        <p className="text-sm text-muted-foreground">
          Images and videos for landing pages, testimonials and products — stored on ImageKit and delivered through its CDN.
        </p>
      </div>
      {imageKitConfigured() ? (
        <MediaLibrary />
      ) : (
        <div className="rounded-2xl border border-border bg-card p-6 text-sm">
          <p className="font-medium">Connect ImageKit to start uploading.</p>
          <ol className="mt-3 list-decimal space-y-1 pl-5 text-muted-foreground">
            <li>In ImageKit, open <strong>Developer options → API keys</strong>.</li>
            <li>Set <code>NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT</code>, <code>NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY</code> and <code>IMAGEKIT_PRIVATE_KEY</code> in <code>.env.local</code> and in your hosting environment variables.</li>
            <li>Restart the dev server (or redeploy).</li>
          </ol>
        </div>
      )}
    </div>
  );
}
