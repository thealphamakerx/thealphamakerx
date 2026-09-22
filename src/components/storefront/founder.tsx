import { Quote, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { siteConfig } from "@/config/site";

export function Founder() {
  return (
    <section className="border-t border-border bg-secondary/30">
      <div className="mx-auto grid max-w-(--breakpoint-xl) grid-cols-1 items-center gap-16 px-6 py-24 md:grid-cols-[.8fr_1.2fr] md:px-16">
        <div className="relative flex min-h-80 flex-col justify-between rounded-md border border-border bg-card p-8 text-foreground">
          <Quote className="size-9" />
          <p className="my-8 font-heading text-3xl font-medium leading-tight tracking-tight">Confidence is a skill.<br />You can build it.</p>
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
            I spent years watching capable, good men hold themselves back — in dating, in their
            careers, in how they carried themselves day to day. Not because they lacked
            intelligence or effort, but because nobody ever taught them the practical skills:
            how to talk to people, how to build a body and a routine you&apos;re proud of, how
            to show up in a relationship without losing yourself.
          </p>
          <p className="text-base text-muted-foreground">
            {siteConfig.name} exists to close that gap — with direct, no-fluff digital guides
            built from real coaching sessions with hundreds of men across Kerala and beyond.
            No hype, no guesswork. Just what actually works.
          </p>
          <Link href="/about" className="alpha-text-link mt-2 justify-center md:justify-start">More about the mission <ArrowUpRight size={18} /></Link>
        </div>
      </div>
    </section>
  );
}
