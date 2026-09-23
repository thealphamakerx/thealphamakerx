import { landingMetadata, renderLanding } from "@/components/landing/render-landing";

export const dynamic = "force-dynamic";

// Reached through the proxy: "/" on a landing page's own domain is rewritten here.
export async function generateMetadata({ params }: PageProps<"/lp/domain/[host]">) {
  return landingMetadata({ domain: decodeURIComponent((await params).host) });
}

export default async function LandingByDomainPage({ params }: PageProps<"/lp/domain/[host]">) {
  return renderLanding({ domain: decodeURIComponent((await params).host) });
}
