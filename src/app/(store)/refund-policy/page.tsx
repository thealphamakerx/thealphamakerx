import type { Metadata } from "next";
import { siteConfig } from "@/config/site";
import { LegalPageShell, LegalSection, LegalList } from "@/components/storefront/legal-page";

export const metadata: Metadata = {
  title: `Refund & Cancellation Policy — ${siteConfig.name}`,
  description: `Our refund and cancellation terms for digital products purchased on ${siteConfig.name}.`,
};

export default function RefundPolicyPage() {
  return (
    <LegalPageShell title="Refund & Cancellation Policy" lastUpdated="September 8, 2026">
      <p>
        All products sold on {siteConfig.url} are digital guides delivered instantly after
        payment. Because access is granted immediately, this policy explains exactly when a
        refund or cancellation is available.
      </p>

      <LegalSection title="1. Order Cancellation">
        <p>
          Once a payment is successfully completed and your order status changes to
          &ldquo;Paid&rdquo;, the order cannot be cancelled, since access to the digital
          product is unlocked immediately. If your payment is still &ldquo;Pending&rdquo; or
          has failed, no order has been created and no charge should apply — check with your
          bank or Razorpay if you believe you were charged in error.
        </p>
      </LegalSection>

      <LegalSection title="2. When a Refund Is Available">
        <p>We will issue a full refund if:</p>
        <LegalList
          items={[
            "You were charged but never received access to your product due to a technical error on our end",
            "The file you received is corrupted, incomplete, or does not match the product you purchased",
            "You were accidentally charged more than once for the same order (duplicate payment)",
          ]}
        />
        <p>Refund requests for these reasons must be made within 7 days of purchase.</p>
      </LegalSection>

      <LegalSection title="3. When a Refund Is Not Available">
        <p>Because our products are instant-access digital downloads, we do not offer refunds:</p>
        <LegalList
          items={[
            "For change of mind after a guide has been successfully downloaded or accessed",
            "Because the content did not match personal expectations or did not produce a desired result",
            "Requested more than 7 days after the purchase date",
          ]}
        />
      </LegalSection>

      <LegalSection title="4. How to Request a Refund">
        <p>
          Email{" "}
          <a href={`mailto:${siteConfig.contactEmail}`} className="text-foreground hover:underline">
            {siteConfig.contactEmail}
          </a>{" "}
          with your order ID and the reason for your request. We typically respond within 24–48
          hours.
        </p>
      </LegalSection>

      <LegalSection title="5. Refund Processing Time">
        <p>
          Approved refunds are issued back to your original Razorpay payment method. Depending
          on your bank or payment provider, it can take 5–7 business days for the refund to
          reflect in your account after we initiate it.
        </p>
      </LegalSection>

      <LegalSection title="6. Contact Us">
        <p>
          For any refund or cancellation questions, reach us at{" "}
          <a href={`mailto:${siteConfig.contactEmail}`} className="text-foreground hover:underline">
            {siteConfig.contactEmail}
          </a>
          .
        </p>
      </LegalSection>
    </LegalPageShell>
  );
}
