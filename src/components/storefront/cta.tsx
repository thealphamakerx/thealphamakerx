import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export function Cta() {
  return (
    <section className="mx-auto max-w-(--breakpoint-xl) px-6 py-16 md:px-16">
      <div className="flex flex-col items-center gap-4 rounded-2xl bg-primary px-6 py-16 text-center text-primary-foreground">
        <h2 className="max-w-xl text-2xl font-semibold tracking-tight md:text-3xl">
          Ready to Become the Man You&apos;re Meant to Be?
        </h2>
        <p className="max-w-md text-sm opacity-90 md:text-base">
          Instant access, practical guides, no fluff. Trusted by thousands of men already
          building real confidence.
        </p>
        <Link
          href="/shop"
          className={buttonVariants({
            size: "lg",
            variant: "secondary",
            className: "mt-2",
          })}
        >
          Get Started Now
        </Link>
      </div>
    </section>
  );
}
