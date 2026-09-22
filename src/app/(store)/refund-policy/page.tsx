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
  title: `Refund & Cancellation Policy — ${siteConfig.name}`,
  description: `Our refund and cancellation terms for digital products purchased on ${siteConfig.name}.`,
};

export default function RefundPolicyPage() {
  return (
    <LegalPageShell title="Refund & Cancellation Policy" lastUpdated="September 17, 2026">
      <p>
        Everything sold on {siteConfig.url} is a digital file that is unlocked the moment your
        payment succeeds. Because there is nothing to return and the goods cannot be
        &ldquo;un-downloaded&rdquo;, refunds are limited to the situations below — but where
        something has genuinely gone wrong, we will always put it right.
      </p>

      <SellerIdentity />

      <LegalSection title="1. Cancelling an Order">
        <p>
          You can abandon a checkout at any point before you complete payment, at no cost. We
          create an order record as soon as you start the payment, but while its status is
          still <strong>Pending</strong> nothing has been charged and no files are unlocked —
          an order that is never paid for simply lapses, and you do not need to do anything.
        </p>
        <p>
          Once Cashfree confirms your payment and the order status becomes{" "}
          <strong>Paid</strong>, your download unlocks immediately and the order can no longer
          be cancelled. From that point the refund rules in section 2 apply instead.
        </p>
      </LegalSection>

      <LegalSection title="2. When We Will Refund You in Full">
        <p>We will refund the full amount you paid if:</p>
        <LegalList
          items={[
            "You were charged but your access never unlocked, because of a technical fault on our side",
            "The file you received is corrupt, will not open, is incomplete, or is not the product described on the page you bought from",
            "You were charged more than once for the same order, or charged more than the price shown at checkout",
            "You were charged for an order you did not authorise, and this is confirmed with Cashfree",
            "We withdraw or cannot supply the product after you have paid for it",
          ]}
        />
        <p>
          Please tell us within <strong>7 days</strong> of the purchase so we can investigate
          while the payment records are fresh. If a file is faulty, our first step will
          normally be to send you a working copy — if we cannot, you get your money back.
        </p>
      </LegalSection>

      <LegalSection title="3. When We Will Not Refund">
        <p>
          Because these are instant-access digital downloads, we do not refund in the
          following cases:
        </p>
        <LegalList
          items={[
            "You changed your mind after downloading or opening the file",
            "The product works as described but did not match what you personally hoped for, or did not produce the result you wanted",
            "You bought the wrong product by mistake, or bought a product you already owned, and have already downloaded it",
            "You cannot open the file because you do not have, or will not install, a spreadsheet application",
            "You gave us an incorrect or unreachable email address and did not contact us to correct it",
            "The request is made more than 7 days after the purchase date",
          ]}
        />
        <p>
          We may also decline a refund where we have clear evidence that the licence in our{" "}
          <Link href="/terms" className="text-foreground hover:underline">
            Terms &amp; Conditions
          </Link>{" "}
          has been breached — for example where the files have been redistributed.
        </p>
      </LegalSection>

      <LegalSection title="4. Failed and Duplicate Payments">
        <p>
          If money left your account but the order did not complete, the payment was almost
          certainly never captured. Your bank normally releases such an authorisation on its
          own within <strong>5 to 7 working days</strong>. If it has not reappeared after
          that, contact us with the date, amount and the last four digits of the card or the
          UPI reference, and we will trace it with Cashfree. Genuine duplicate charges are
          refunded in full as soon as we confirm them — you do not need to prove anything
          beyond the transaction details.
        </p>
      </LegalSection>

      <LegalSection title="5. How to Request a Refund">
        <p>
          Email{" "}
          <a href={`mailto:${siteConfig.contactEmail}`} className="text-foreground hover:underline">
            {siteConfig.contactEmail}
          </a>{" "}
          from the address you used to order, with:
        </p>
        <LegalList
          items={[
            "Your order number (shown on the confirmation page and in your confirmation email)",
            "The name of the product",
            "What went wrong — and a screenshot or the error message, if there is one",
          ]}
        />
        <p>
          We acknowledge every request within <strong>48 hours</strong> and give you a decision
          within <strong>7 working days</strong>. If we need more information we will say so
          in that first reply.
        </p>
      </LegalSection>

      <LegalSection title="6. How Refunds Are Paid">
        <p>
          Approved refunds are always returned through Cashfree to the original payment method
          — the same card, UPI ID or bank account you paid from. We cannot redirect a refund
          to a different account, and we do not refund in cash, credit or vouchers unless you
          ask for a credit and we agree to it.
        </p>
        <p>
          We initiate the refund within <strong>3 working days</strong> of approving it. It
          then typically takes a further <strong>5 to 7 working days</strong> to appear on
          your statement, depending on your bank or card issuer. That final leg is controlled
          by your bank, not by us. Your access to the product is withdrawn when a refund is
          issued.
        </p>
      </LegalSection>

      <LegalSection title="7. Chargebacks">
        <p>
          If something has gone wrong, please contact us first — we can almost always resolve
          it faster than a bank dispute. Raising a chargeback without contacting us may lead
          to your access being suspended while the dispute is investigated with Cashfree. This
          does not affect your right to dispute a genuinely fraudulent transaction with your
          bank.
        </p>
      </LegalSection>

      <LegalSection title="8. Your Statutory Rights">
        <p>
          Nothing in this policy takes away the rights you have under the Consumer Protection
          Act, 2019 and the Consumer Protection (E-Commerce) Rules, 2020, including your right
          to a remedy for goods that are defective or not as described. If you are not
          satisfied with how we have handled your complaint, you may escalate it to the
          National Consumer Helpline (1915) or the appropriate Consumer Disputes Redressal
          Commission.
        </p>
      </LegalSection>

      <LegalSection title="9. Contact">
        <p>
          For anything about refunds or cancellations, write to{" "}
          <a href={`mailto:${siteConfig.contactEmail}`} className="text-foreground hover:underline">
            {siteConfig.contactEmail}
          </a>
          . See also our{" "}
          <Link href="/shipping-policy" className="text-foreground hover:underline">
            Shipping &amp; Delivery Policy
          </Link>{" "}
          and{" "}
          <Link href="/terms" className="text-foreground hover:underline">
            Terms &amp; Conditions
          </Link>
          .
        </p>
      </LegalSection>
    </LegalPageShell>
  );
}
