import { ShieldCheck, Zap, Star, Users } from "lucide-react";

const ITEMS = [
  { icon: Zap, label: "Instant Access" },
  { icon: ShieldCheck, label: "Secure Payment" },
  { icon: Star, label: "5-Star Rated" },
  { icon: Users, label: "1000s of Members" },
];

export function TrustBar() {
  return (
    <section className="border-y border-border bg-background">
      <div className="mx-auto grid max-w-(--breakpoint-xl) grid-cols-2 gap-6 px-6 py-6 md:grid-cols-4">
        {ITEMS.map(({ icon: Icon, label }) => (
          <div key={label} className="flex items-center justify-center gap-2 text-center">
            <Icon className="size-4 text-primary" />
            <span className="text-xs font-medium md:text-sm">{label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
