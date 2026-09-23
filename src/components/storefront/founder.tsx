import { Quote, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { siteConfig } from "@/config/site";

export function Founder() {
  return (
    <section className="border-t border-border bg-secondary/30">
      <div className="mx-auto grid max-w-(--breakpoint-xl) grid-cols-1 items-center gap-8 px-6 py-14 md:grid-cols-[.8fr_1.2fr] md:gap-16 md:px-16 md:py-24">
        <div className="relative flex min-h-80 flex-col justify-between rounded-md border border-border bg-card p-8 text-foreground">
          <Quote className="size-9" />
          <p className="my-8 font-heading text-3xl font-medium leading-tight tracking-tight">Attraction is a skill.<br />You can learn it.</p>
          <span className="text-xs tracking-widest uppercase">The Alpha Maker X</span>
        </div>
        <div className="flex flex-col gap-4 text-center md:text-left">
          <span className="text-sm font-medium tracking-wide text-primary uppercase">
            Meet Your Coach
          </span>
          <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
            Why I Built {siteConfig.name}
          </h2>
          <p className="text-base text-muted-foreground">
            I kept seeing good men get ignored, friend-zoned or taken for granted — not because
            they lacked looks or money, but because nobody ever told them how attraction and
            relationships actually work. Most dating advice is written by men who already have
            every advantage, so it rarely works for everyone else.
          </p>
          <p className="text-base text-muted-foreground">
            {siteConfig.name} exists to close that gap with direct, no-fluff guides for ordinary
            men: how to create attraction, how to read the signals, how to earn respect instead
            of begging for attention, and how to choose a partner with clear eyes.
          </p>
          <Link href="/about" className="alpha-text-link mt-2 justify-center md:justify-start">More about the mission <ArrowUpRight size={18} /></Link>
        </div>
      </div>
    </section>
  );
}
