import type { Metadata } from "next";
import { siteConfig } from "@/config/site";
import { LegalPageShell, LegalSection, LegalList } from "@/components/storefront/legal-page";

export const metadata: Metadata = {
  title: `Shipping & Delivery Policy — ${siteConfig.name}`,
  description: `How digital products are delivered on ${siteConfig.name}.`,
};

export default function ShippingPolicyPage() {
  return (
    <LegalPageShell title="Shipping & Delivery Policy" lastUpdated="September 8, 2026">
      <p>
        {siteConfig.name} sells 100% digital products. There is no physical shipping, so
        there are no shipping charges, courier delays, or delivery addresses involved in any
        order.
      </p>

      <LegalSection title="1. How Delivery Works">
        <p>
          As soon as Razorpay confirms your payment, your order status updates to
          &ldquo;Paid&rdquo; and access to your guide unlocks instantly:
        </p>
        <LegalList
          items={[
            "You are redirected to an order confirmation page with a direct download link",
            "The same download link remains available permanently under My Orders in your account",
            "Download links are generated fresh and securely each time you click them, and expire a few minutes after being issued for your protection",
          ]}
        />
      </LegalSection>

      <LegalSection title="2. Delivery Time">
        <p>
          Delivery is instant. If your payment succeeds but you don&apos;t see access unlock
          within a few minutes, refresh your Orders page or contact us — this is almost always
          a temporary sync delay, not a lost order.
        </p>
      </LegalSection>

      <LegalSection title="3. File Format & Access">
        <p>
          Guides are delivered as PDF files (occasionally bundled with bonus worksheets as a
          ZIP). You can download and view them on any phone, tablet, or computer. No special
          app is required — any PDF reader will work.
        </p>
      </LegalSection>

      <LegalSection title="4. International Access">
        <p>
          Since delivery is fully digital, customers anywhere in the world can purchase and
          access our products, subject to Razorpay&apos;s supported payment methods and
          regions.
        </p>
      </LegalSection>

      <LegalSection title="5. Delivery Issues">
        <p>
          If you paid successfully but cannot access or download your product, email{" "}
          <a href={`mailto:${siteConfig.contactEmail}`} className="text-foreground hover:underline">
            {siteConfig.contactEmail}
          </a>{" "}
          with your order ID and we&apos;ll resolve it promptly.
        </p>
      </LegalSection>
    </LegalPageShell>
  );
}
