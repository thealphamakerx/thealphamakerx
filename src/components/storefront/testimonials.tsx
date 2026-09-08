import { Star } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const TESTIMONIALS = [
  {
    name: "Arjun M.",
    location: "Kochi",
    quote:
      "I read the Confidence Code in a weekend and started using the conversation frameworks the same week. First real change was just how much less I overthought talking to new people.",
  },
  {
    name: "Nikhil P.",
    location: "Thiruvananthapuram",
    quote:
      "The fitness guide is refreshingly simple — no confusing routines, just a plan I could actually stick to. Down 6 kilos and my energy at work is completely different.",
  },
  {
    name: "Rahul S.",
    location: "Kozhikode",
    quote:
      "The relationship guide helped me and my partner actually talk about the things we used to avoid. Worth far more than what I paid for it.",
  },
];

export function Testimonials() {
  return (
    <section className="mx-auto max-w-(--breakpoint-xl) px-6 py-16 md:px-16">
      <div className="mb-10 flex flex-col items-center gap-2 text-center">
        <span className="text-sm font-medium tracking-wide text-primary uppercase">
          Real Results
        </span>
        <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
          What Members Are Saying
        </h2>
      </div>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {TESTIMONIALS.map((t) => (
          <Card key={t.name}>
            <CardContent className="flex flex-col gap-4">
              <div className="flex gap-0.5 text-primary">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="size-4 fill-current" />
                ))}
              </div>
              <p className="text-sm text-muted-foreground">&ldquo;{t.quote}&rdquo;</p>
              <div className="text-sm font-medium">
                {t.name} <span className="font-normal text-muted-foreground">· {t.location}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
