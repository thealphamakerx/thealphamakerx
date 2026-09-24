import type { Metadata } from "next";
import Link from "next/link";
import { siteConfig } from "@/config/site";
import {
  LegalPageShell,
  LegalSection,
  LegalSubSection,
  LegalList,
  SellerIdentity,
} from "@/components/storefront/legal-page";

export const metadata: Metadata = {
  title: `Privacy Policy — ${siteConfig.name}`,
  description: `How ${siteConfig.name} collects, uses, stores, and protects your personal information.`,
};

export default function PrivacyPolicyPage() {
  return (
    <LegalPageShell title="Privacy Policy" lastUpdated="September 17, 2026">
      <p>
        This policy explains what personal data {siteConfig.name} (&ldquo;we&rdquo;,
        &ldquo;us&rdquo;, &ldquo;our&rdquo;) collects when you use {siteConfig.url}, why we
        collect it, who we share it with, and the rights you have over it. It is written to
        meet our obligations under India&apos;s Digital Personal Data Protection Act, 2023
        (&ldquo;DPDP Act&rdquo;) and the Information Technology Act, 2000.
      </p>

      <SellerIdentity />

      <LegalSection title="1. Information We Collect">
        <LegalSubSection title="1.1 Information you give us">
          At checkout, we collect your <strong>email address</strong> for delivery and your
          <strong> mobile number</strong> for Cashfree payment processing. If you create an account, we also collect your
          <strong> name</strong> and, where you set one, a <strong>password</strong> that is
          stored only as a salted cryptographic hash and is never readable by us. If you sign
          in with Google instead, we receive your name, email address and profile picture from
          Google and store no password at all. If you email us for support, we keep that
          correspondence.
        </LegalSubSection>
        <LegalSubSection title="1.2 Payment information">
          All payments are processed by Cashfree. We never receive, see or store your card
          number, CVV, UPI PIN, net-banking credentials or bank account details — those are
          handled entirely inside Cashfree&apos;s PCI-DSS compliant systems. What reaches us
          includes order and payment identifiers, amounts, payment status, timestamps, and
          refund status. We retain these records to confirm purchases, deliver downloads,
          reconcile payments, and resolve support requests.
        </LegalSubSection>
        <LegalSubSection title="1.3 Order and review information">
          We store the products you bought, the amount paid, any coupon applied, and the order
          status. If you post a product review, we store its rating and text together with
          your account, and display it publicly with your name once approved.
        </LegalSubSection>
        <LegalSubSection title="1.4 Information collected automatically">
          When you sign in, we record the IP address and browser user-agent attached to that
          login session, so you and we can recognise unusual account activity. We also use IP
          addresses transiently to rate-limit sign-in attempts and other sensitive endpoints
          against brute-force and abuse. We do not run third-party advertising or behavioural
          analytics trackers, and we do not build advertising profiles.
        </LegalSubSection>
      </LegalSection>

      <LegalSection title="2. What We Store in Your Browser">
        <p>
          We use a small number of strictly necessary storage mechanisms. None of them are
          used for advertising or cross-site tracking:
        </p>
        <LegalList
          items={[
            "A session cookie that keeps you signed in. Deleting it signs you out.",
            "Your shopping cart, held in your browser's local storage on your own device — it is not transmitted to us until you check out.",
            "Standard security cookies used during sign-in to prevent request forgery.",
            "A checkout reference and signed access token in session storage so an interrupted payment can be resumed in the same browser tab.",
          ]}
        />
        <p>
          You can clear this data at any time through your browser settings; the site will
          still work, but you will be signed out and your cart will be empty.
        </p>
      </LegalSection>

      <LegalSection title="3. How and Why We Use Your Information">
        <LegalList
          items={[
            "To process your order, take payment and unlock the files you purchased — this is necessary to perform the contract you enter into with us",
            "To email you an order confirmation containing your download link, and to notify you if an order is cancelled or refunded",
            "To give you access to your purchase history and to re-download files you have already paid for",
            "To publish product reviews you choose to submit, after moderation",
            "To detect, investigate and prevent fraud, payment abuse and unauthorised access to accounts",
            "To meet our tax, accounting and other legal obligations",
          ]}
        />
        <p>
          We do not use your personal data for automated decision-making that produces legal
          effects, and we do not send marketing email unless you have separately asked us to.
        </p>
      </LegalSection>

      <LegalSection title="4. Who We Share It With">
        <p>
          We do not sell your personal data. We share the minimum necessary with the following
          processors, each of whom is bound to use it only to provide their service to us:
        </p>
        <LegalList
          items={[
            "Cashfree Payments — payment processing. Receives your payment details directly from you and returns a payment result to us.",
            "Neon — managed PostgreSQL database hosting for your account and order records.",
            "Cloudflare R2 — private object storage holding the product files you download.",
            "Resend — transactional email delivery. Receives your email address and the contents of order confirmation and status emails.",
            "Google LLC — only if you choose to sign in with Google, in which case Google authenticates you and tells us your name, email address and profile picture.",
          ]}
        />
        <p>
          We may also disclose personal data where we are legally required to do so — for
          example in response to a valid order from a court, tax authority or law enforcement
          agency — or where it is necessary to establish or defend a legal claim.
        </p>
      </LegalSection>

      <LegalSection title="5. Where Your Data Is Stored">
        <p>
          Our database and the storage holding the product files are hosted by Neon in the
          United States (AWS <code>us-east-2</code> region). Our email provider and Google
          also process data outside India. This means your personal data is transferred to and
          stored on servers outside India. We rely on these providers&apos; contractual data
          protection commitments to keep that data protected to the standard described in this
          policy. By using the site and placing an order, you acknowledge this transfer.
        </p>
      </LegalSection>

      <LegalSection title="6. Security">
        <p>
          Connections to the site are encrypted with HTTPS, and data is encrypted in transit
          and at rest by our hosting providers. Passwords are stored only as salted hashes.
          Your purchased files are never served from a public URL — each download is handed
          out as a freshly signed link that expires within minutes of being issued, and access
          is re-checked against your order&apos;s live status every single time. Administrative
          functions are restricted to accounts we have explicitly granted the admin role, and
          sensitive administrative changes are recorded in an internal audit log.
        </p>
        <p>
          No system can be guaranteed completely secure. If we ever become aware of a personal
          data breach affecting you, we will notify you and the Data Protection Board of India
          as required by the DPDP Act.
        </p>
      </LegalSection>

      <LegalSection title="7. How Long We Keep It">
        <LegalList
          items={[
            "Order and payment records: retained for at least eight years, as required by Indian tax and accounting law, even if you close your account.",
            "Account details: retained while your account is open, and deleted on request subject to the order records above.",
            "Guest purchases: the email address and order are retained on the same basis, so that your permanent download link keeps working.",
            "Login session records, including IP and user-agent: retained for a short period and then removed as sessions expire.",
            "Support email: retained for as long as needed to resolve your issue and for a reasonable period afterwards.",
          ]}
        />
      </LegalSection>

      <LegalSection title="8. Your Rights">
        <p>Under the DPDP Act you have the right to:</p>
        <LegalList
          items={[
            "Ask for a summary of the personal data we hold about you and how we process it",
            "Ask us to correct or complete inaccurate or incomplete data",
            "Ask us to erase your personal data, where we are not required by law to keep it",
            "Withdraw a consent you previously gave, at any time — this does not affect processing already carried out",
            "Nominate another person to exercise these rights on your behalf if you die or become incapacitated",
            "Raise a grievance with us, and escalate to the Data Protection Board of India if you are not satisfied with our response",
          ]}
        />
        <p>
          To exercise any of these, email us at the address below. We will respond within 30
          days. Note that erasing your account does not withdraw your purchases from our
          financial records, which we are legally required to retain.
        </p>
      </LegalSection>

      <LegalSection title="9. Children">
        <p>
          Our products and this site are intended for adults. We do not knowingly collect
          personal data from anyone under 18. If you believe a child has provided us with
          personal data, contact us and we will delete it.
        </p>
      </LegalSection>

      <LegalSection title="10. Changes to This Policy">
        <p>
          We may update this policy as our service changes. The &ldquo;Last updated&rdquo;
          date at the top always reflects the current version. Where a change materially
          affects your rights, we will take reasonable steps to bring it to your attention.
        </p>
      </LegalSection>

      <LegalSection title="11. Grievance Redressal & Contact">
        <p>
          For any privacy question, request or complaint — including to exercise the rights in
          section 8 — contact our Grievance Officer at{" "}
          <a href={`mailto:${siteConfig.contactEmail}`} className="text-foreground hover:underline">
            {siteConfig.contactEmail}
          </a>
          . We acknowledge grievances within 48 hours and aim to resolve them within 30 days.
        </p>
        <p>
          See also our{" "}
          <Link href="/terms" className="text-foreground hover:underline">
            Terms &amp; Conditions
          </Link>
          ,{" "}
          <Link href="/refund-policy" className="text-foreground hover:underline">
            Refund &amp; Cancellation Policy
          </Link>{" "}
          and{" "}
          <Link href="/shipping-policy" className="text-foreground hover:underline">
            Shipping &amp; Delivery Policy
          </Link>
          .
        </p>
      </LegalSection>
    </LegalPageShell>
  );
}
