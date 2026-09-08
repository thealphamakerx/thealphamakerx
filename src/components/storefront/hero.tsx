import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { siteConfig } from "@/config/site";

export function Hero() {
  return (
    <section className="relative flex min-h-[70vh] flex-col items-center justify-center gap-6 bg-secondary/40 px-6 py-24 text-center md:px-16">
      <span className="text-sm font-medium tracking-wide text-primary uppercase">
        {siteConfig.eyebrow}
      </span>
      <h1 className="max-w-2xl text-4xl font-semibold tracking-tight md:text-6xl">
        {siteConfig.heroHeadline}
      </h1>
      <p className="max-w-xl text-base text-muted-foreground md:text-lg">
        {siteConfig.heroSubheadline}
      </p>
      <Link href="/shop" className={buttonVariants({ size: "lg", className: "mt-2" })}>
        Shop Now
      </Link>
    </section>
  );
}
