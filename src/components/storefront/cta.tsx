import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export function Cta() {
  return (
    <section className="w-full mx-auto max-w-(--breakpoint-xl) px-6 py-16 md:px-16">
      <div className="flex flex-col items-center gap-4 relative overflow-hidden rounded-[2rem] bg-primary px-6 py-16 text-center text-primary-foreground">
        <h2 className="max-w-2xl text-2xl font-semibold tracking-tight md:text-5xl">
          Ready to Stop Guessing?
        </h2>
        <p className="max-w-md text-sm opacity-90 md:text-base">
          Practical guides on dating, attraction and understanding women — instant, private
          download.
        </p>
        <Link
          href="/shop"
          className={buttonVariants({
            size: "lg",
            variant: "secondary",
            className: "mt-4 h-12 rounded-full px-7",
          })}
        >
          See the Guides
        </Link>
      </div>
    </section>
  );
}
