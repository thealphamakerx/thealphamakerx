import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { getLandingPage } from "@/lib/landing";
import { LandingView, loadLanding } from "./landing-view";

type Where = { slug: string } | { domain: string };

/** A published page for everyone; an unpublished one only as an admin preview. */
async function resolve(where: Where) {
  const page = await getLandingPage(where);
  if (!page) return null;
  if (!page.isActive) {
    const session = await auth.api.getSession({ headers: await headers() });
    if ((session?.user as { role?: string } | undefined)?.role !== "ADMIN") return null;
  }
  const data = await loadLanding(page);
  return data ? { page, data } : null;
}

export async function renderLanding(where: Where) {
  const resolved = await resolve(where);
  if (!resolved) notFound();
  const { page, data } = resolved;
  return (
    <>
      {!page.isActive && (
        <p className="bg-accent px-4 py-2 text-center text-xs text-accent-foreground">Preview — this page is not published yet.</p>
      )}
      <LandingView page={page} data={data} />
    </>
  );
}

export async function landingMetadata(where: Where): Promise<Metadata> {
  const page = await getLandingPage(where);
  if (!page) return {};
  const title = page.content.headline || page.name;
  return {
    title,
    description: page.content.subheadline || undefined,
    robots: page.isActive ? undefined : { index: false },
    openGraph: { title, description: page.content.subheadline || undefined },
  };
}
