import type { ReactNode } from "react";
import Link from "next/link";
import { siteConfig } from "@/config/site";

export function LegalPageShell({
  title,
  lastUpdated,
  children,
}: {
  title: string;
  lastUpdated: string;
  children: ReactNode;
}) {
  return (
    <main className="flex-1">
      <div className="mx-auto max-w-(--breakpoint-md) px-6 py-16 md:px-16">
        <Link href="/" className="text-xs text-muted-foreground hover:underline">
          ← Back to Home
        </Link>

        <h1 className="mt-4 text-3xl font-semibold tracking-tight">{title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">Last updated: {lastUpdated}</p>

        <div className="mt-8 flex flex-col gap-8 text-sm text-muted-foreground">{children}</div>
      </div>
    </main>
  );
}

export function LegalSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-lg font-semibold text-foreground">{title}</h2>
      {children}
    </section>
  );
}

export function LegalSubSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <h3 className="text-sm font-medium text-foreground">{title}</h3>
      <p>{children}</p>
    </div>
  );
}

export function LegalList({ items }: { items: string[] }) {
  return (
    <ul className="list-inside list-disc space-y-1">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

/**
 * Seller identity block. The Consumer Protection (E-Commerce) Rules, 2020 and
 * Razorpay's merchant terms both require the legal name, address and working
 * contact details of the seller to be published, so every policy page carries
 * this same block rather than burying the details on /contact.
 */
export function SellerIdentity() {
  return (
    <section className="flex flex-col gap-2 rounded-2xl border border-border bg-secondary/40 p-5 text-sm">
      <span className="font-semibold text-foreground">{siteConfig.legalName}</span>
      <address className="not-italic">
        {siteConfig.addressLines.map((line) => (
          <span key={line} className="block">
            {line}
          </span>
        ))}
      </address>
      <span>
        Email:{" "}
        <a href={`mailto:${siteConfig.contactEmail}`} className="text-foreground hover:underline">
          {siteConfig.contactEmail}
        </a>
      </span>
      <span>
        Phone:{" "}
        <a
          href={`tel:${siteConfig.contactPhone.replace(/\s/g, "")}`}
          className="text-foreground hover:underline"
        >
          {siteConfig.contactPhone}
        </a>
      </span>
      {siteConfig.gstin && <span>GSTIN: {siteConfig.gstin}</span>}
    </section>
  );
}
