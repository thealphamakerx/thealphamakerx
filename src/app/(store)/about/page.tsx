import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: `About Us — ${siteConfig.name}`,
  description: siteConfig.description,
};

export default function AboutPage() {
  return (
    <main className="flex-1">
      <section className="mx-auto max-w-(--breakpoint-md) px-6 py-16 text-center md:px-16">
        <span className="text-sm font-medium tracking-wide text-primary uppercase">
          About {siteConfig.name}
        </span>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">
          {siteConfig.eyebrow}
        </h1>
        <p className="mt-4 text-base text-muted-foreground md:text-lg">
          {siteConfig.heroSubheadline}
        </p>
      </section>

      <section className="mx-auto grid max-w-(--breakpoint-xl) grid-cols-1 items-center gap-10 px-6 pb-16 md:grid-cols-[280px_1fr] md:px-16">
        <div className="mx-auto size-48 overflow-hidden rounded-full border border-border bg-secondary md:mx-0 md:size-64">
          <Image
            src="https://picsum.photos/seed/thealphamakerx-coach/600/600"
            alt="Founder of The Alpha Maker X"
            width={600}
            height={600}
            className="size-full object-cover"
          />
        </div>
        <div className="flex flex-col gap-4">
          <h2 className="text-xl font-semibold">Our Story</h2>
          <p className="text-sm text-muted-foreground">
            {siteConfig.name} started with one-on-one coaching in Kerala, helping men work
            through the same issues over and over: low confidence, poor communication in
            relationships, and no clear plan for their health. We turned years of coaching
            conversations into structured, practical digital guides so any man — anywhere —
            can get the same frameworks without needing a personal session.
          </p>
          <p className="text-sm text-muted-foreground">
            We don&apos;t sell hype or shortcuts. Every guide is built around habits and
            skills you actually practice, with clear, respectful advice on dating,
            relationships, and self-improvement.
          </p>
          <h2 className="mt-4 text-xl font-semibold">What We Stand For</h2>
          <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
            <li>Practical, actionable content — no vague motivation-only fluff</li>
            <li>Respect for the people in your life, including the women in it</li>
            <li>Honest pricing and instant digital delivery, every time</li>
            <li>Real support if something in your order isn&apos;t right</li>
          </ul>
        </div>
      </section>

      <section className="border-t border-border bg-secondary/30">
        <div className="mx-auto flex max-w-(--breakpoint-xl) flex-col items-center gap-4 px-6 py-16 text-center md:px-16">
          <h2 className="text-2xl font-semibold tracking-tight">
            Ready to Start Building?
          </h2>
          <Link href="/shop" className={buttonVariants({ size: "lg" })}>
            Browse Guides
          </Link>
        </div>
      </section>
    </main>
  );
}
