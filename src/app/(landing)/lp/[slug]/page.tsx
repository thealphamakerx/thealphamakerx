import { landingMetadata, renderLanding } from "@/components/landing/render-landing";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PageProps<"/lp/[slug]">) {
  return landingMetadata({ slug: (await params).slug });
}

export default async function LandingBySlugPage({ params }: PageProps<"/lp/[slug]">) {
  return renderLanding({ slug: (await params).slug });
}
