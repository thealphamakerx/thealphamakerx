import type { Metadata } from "next";
import { Mail } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { ContactForm } from "@/components/storefront/contact-form";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: `Contact Us — ${siteConfig.name}`,
  description: `Get in touch with ${siteConfig.name} for order support, refunds, or general questions.`,
};

const CONTACT_ITEMS = [
  {
    icon: Mail,
    label: "Email",
    value: siteConfig.contactEmail,
    href: `mailto:${siteConfig.contactEmail}`,
  },

];

export default function ContactPage() {
  return (
    <main className="flex-1">
      <section className="mx-auto max-w-(--breakpoint-md) px-6 py-16 text-center md:px-16">
        <span className="text-sm font-medium tracking-wide text-primary uppercase">
          Get In Touch
        </span>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">Contact Us</h1>
        <p className="mt-4 text-base text-muted-foreground">
          Questions about an order, a refund, or a tracker before you buy? We usually reply
          within 24 hours. Email us or fill in the form below.
        </p>
      </section>

      <section className="mx-auto max-w-(--breakpoint-sm) px-6 pb-16 md:px-16">
        <div className="flex flex-col gap-4">
          {CONTACT_ITEMS.map(({ icon: Icon, label, value, href }) => (
            <Card key={label}>
              <CardContent className="flex items-center gap-4">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Icon className="size-5" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs text-muted-foreground">{label}</span>
                  {href ? (
                    <a
                      href={href}
                      className="text-sm font-medium hover:underline"
                    >
                      {value}
                    </a>
                  ) : (
                    <span className="text-sm font-medium">{value}</span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <ContactForm />
      </section>
    </main>
  );
}
