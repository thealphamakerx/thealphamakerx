import Image from "next/image";
import { siteConfig } from "@/config/site";

export function Founder() {
  return (
    <section className="border-t border-border bg-secondary/30">
      <div className="mx-auto grid max-w-(--breakpoint-xl) grid-cols-1 items-center gap-10 px-6 py-16 md:grid-cols-[280px_1fr] md:px-16">
        <div className="mx-auto size-48 overflow-hidden rounded-full border border-border bg-secondary md:mx-0 md:size-64">
          <Image
            src="https://picsum.photos/seed/thealphamakerx-coach/600/600"
            alt="Founder of The Alpha Maker X"
            width={600}
            height={600}
            className="size-full object-cover"
          />
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
        </div>
      </div>
    </section>
  );
}
