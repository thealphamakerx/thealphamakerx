import type { Metadata } from "next";
import Link from "next/link";
import { siteConfig } from "@/config/site";
import {
  LegalPageShell,
  LegalSection,
  LegalList,
  SellerIdentity,
} from "@/components/storefront/legal-page";

export const metadata: Metadata = {
  title: `Shipping & Delivery Policy — ${siteConfig.name}`,
  description: `How digital products are delivered on ${siteConfig.name} — instantly, by download, with no physical shipping.`,
};

export default function ShippingPolicyPage() {
  return (
    <LegalPageShell title="Shipping & Delivery Policy" lastUpdated="September 17, 2026">
      <p>
        {siteConfig.name} sells digital products only. Nothing is posted or couriered, so
        there are no shipping charges, no delivery addresses and no waiting. Everything is
        delivered electronically, the moment your payment succeeds.
      </p>

      <SellerIdentity />

      <LegalSection title="1. How Delivery Works">
        <p>
          As soon as Cashfree confirms your payment, your order is marked{" "}
          <strong>Paid</strong> and your files unlock straight away:
        </p>
        <LegalList
          items={[
            "You are taken to an order confirmation page carrying your download link",
            "We email the same link to the address you gave at checkout, as your receipt and backup",
            "If you have an account, the purchase also appears permanently under My Orders",
            "If you checked out as a guest, your emailed link is permanent and is the way back to your files — keep that email",
          ]}
        />
      </LegalSection>

      <LegalSection title="2. Delivery Time">
        <p>
          Delivery is immediate — in practice a few seconds. Very occasionally a payment
          confirmation takes a minute or two to reach us from Cashfree. If your payment
          succeeded but access has not unlocked after about five minutes, refresh the order
          page first; if it still has not appeared, contact us and we will unlock it manually.
          A delayed confirmation is a sync delay, not a lost order or a lost payment.
        </p>
      </LegalSection>

      <LegalSection title="3. File Format and What You Need">
        <p>
          Products are delivered as Microsoft Excel spreadsheets (.xlsx), occasionally bundled
          with extra sheets in a ZIP archive. You will need a spreadsheet application to open
          them — Microsoft Excel, Google Sheets, Apple Numbers, LibreOffice Calc and most
          mobile spreadsheet apps all work. We do not supply that software.
        </p>
        <p>
          On a phone or tablet, some browsers save the file rather than opening it. If that
          happens, look in your Downloads folder and open it from your spreadsheet app. We
          recommend downloading on a laptop or desktop where you can.
        </p>
      </LegalSection>

      <LegalSection title="4. Re-downloading and Ongoing Access">
        <p>
          Your access does not expire. You can come back and download your files again
          whenever you need them, at no extra cost, from My Orders or from your emailed link.
        </p>
        <p>
          For security, the actual download URL is generated fresh each time you click through
          and stops working a few minutes after it is issued. This is deliberate: it stops a
          copied link being passed around. If a link has gone stale, just click through from
          your order again and a new one is issued instantly.
        </p>
        <p>
          Access is tied to your order remaining valid. If an order is refunded or cancelled,
          access to that product ends.
        </p>
      </LegalSection>

      <LegalSection title="5. If Something Goes Wrong">
        <p>Before contacting us, it is worth checking:</p>
        <LegalList
          items={[
            "Your spam, promotions and junk folders for the confirmation email",
            "That the email address you entered at checkout was spelled correctly",
            "That you are signed in to the same account you bought with, if you used an account",
          ]}
        />
        <p>
          If you paid but still cannot get to your files, email{" "}
          <a href={`mailto:${siteConfig.contactEmail}`} className="text-foreground hover:underline">
            {siteConfig.contactEmail}
          </a>{" "}
          with your order number and we will resend your link. We answer delivery problems
          within <strong>48 hours</strong>, and there is no charge for resending anything you
          have already bought. If we genuinely cannot deliver, our{" "}
          <Link href="/refund-policy" className="text-foreground hover:underline">
            Refund &amp; Cancellation Policy
          </Link>{" "}
          entitles you to a full refund.
        </p>
      </LegalSection>

      <LegalSection title="6. Buying From Outside India">
        <p>
          Our prices are in Indian Rupees and our checkout is built for Indian payment methods.
          Because delivery is digital, there is no geographic restriction on the files
          themselves — but whether your card or bank can complete an INR payment depends on
          your issuer and on the international payment methods Cashfree supports at the time.
          If your payment is declined from outside India, that is a restriction at the payment
          stage, and no order is created and no charge is made.
        </p>
      </LegalSection>

      <LegalSection title="7. Contact">
        <p>
          For any delivery question, reach us at{" "}
          <a href={`mailto:${siteConfig.contactEmail}`} className="text-foreground hover:underline">
            {siteConfig.contactEmail}
          </a>{" "}
          or use our <Link href="/contact" className="text-foreground hover:underline">contact form</Link>. See also our{" "}
          <Link href="/terms" className="text-foreground hover:underline">
            Terms &amp; Conditions
          </Link>
          .
        </p>
      </LegalSection>
    </LegalPageShell>
  );
}
