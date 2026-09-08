import type { Metadata } from "next";
import { siteConfig } from "@/config/site";
import {
  LegalPageShell,
  LegalSection,
  LegalSubSection,
  LegalList,
} from "@/components/storefront/legal-page";

export const metadata: Metadata = {
  title: `Privacy Policy — ${siteConfig.name}`,
  description: `How ${siteConfig.name} collects, uses, and protects your personal information.`,
};

export default function PrivacyPolicyPage() {
  return (
    <LegalPageShell title="Privacy Policy" lastUpdated="September 8, 2026">
      <p>
        {siteConfig.name} (&ldquo;we&rdquo;, &ldquo;us&rdquo;, &ldquo;our&rdquo;) operates{" "}
        {siteConfig.url}. This policy explains what personal information we collect, how we
        use it, and the choices you have. By using our website or purchasing a product, you
        agree to the practices described here.
      </p>

      <LegalSection title="1. Information We Collect">
        <LegalSubSection title="1.1 Information you provide directly">
          When you create an account or place an order, we collect your name, email address,
          and a hashed password. If you contact us for support, we collect whatever
          information you share in that conversation.
        </LegalSubSection>
        <LegalSubSection title="1.2 Payment information">
          All payments are processed by Razorpay. We never see, collect, or store your full
          card number, UPI ID, or bank account details — those are handled entirely within
          Razorpay&apos;s secure, PCI-DSS compliant systems. We only receive a payment
          confirmation, an order ID, and a payment ID to mark your order as paid.
        </LegalSubSection>
        <LegalSubSection title="1.3 Automatically collected information">
          Like most websites, we automatically log basic technical data such as IP address,
          browser type, device type, and pages visited, for security and analytics purposes.
        </LegalSubSection>
      </LegalSection>

      <LegalSection title="2. How We Use Your Information">
        <p>We use the information we collect to:</p>
        <LegalList
          items={[
            "Create and manage your account",
            "Process orders and unlock access to the digital guides you purchase",
            "Send order confirmations and, when relevant, support responses",
            "Detect and prevent fraud, abuse, or unauthorized access",
            "Improve our website, products, and customer experience",
          ]}
        />
      </LegalSection>

      <LegalSection title="3. Data Storage & Security">
        <p>
          Your data is stored on Neon (a managed PostgreSQL provider) with encryption in
          transit and at rest. Digital product files are stored on Cloudflare R2 and made
          available only through time-limited, signed download links generated at the moment
          you access them. We use industry-standard measures — hashed passwords, HTTPS, and
          access controls — to protect your data, but no system is 100% secure, and we cannot
          guarantee absolute security.
        </p>
      </LegalSection>

      <LegalSection title="4. Third-Party Services">
        <p>We share the minimum necessary data with the following trusted providers:</p>
        <LegalList
          items={[
            "Razorpay — payment processing. See razorpay.com/privacy for their policy.",
            "Cloudflare R2 — secure file storage and delivery of purchased guides.",
            "Neon (Postgres) — database hosting for accounts and orders.",
          ]}
        />
        <p>We do not sell your personal information to third parties for marketing purposes.</p>
      </LegalSection>

      <LegalSection title="5. Cookies">
        <p>
          We use essential cookies to keep you signed in and to remember items in your cart.
          These are required for the site to function and are not used for third-party
          advertising.
        </p>
      </LegalSection>

      <LegalSection title="6. Data Retention">
        <p>
          We retain your account and order data for as long as your account is active, so you
          retain permanent access to guides you&apos;ve purchased. You may request deletion of
          your account at any time, subject to us keeping order records required for tax and
          accounting purposes.
        </p>
      </LegalSection>

      <LegalSection title="7. Your Rights">
        <p>
          You can request a copy of the personal data we hold about you, ask us to correct
          inaccurate information, or request deletion of your account by emailing{" "}
          <a href={`mailto:${siteConfig.contactEmail}`} className="text-foreground hover:underline">
            {siteConfig.contactEmail}
          </a>
          . We will respond within a reasonable time.
        </p>
      </LegalSection>

      <LegalSection title="8. Children's Privacy">
        <p>
          Our products and services are intended for adults. We do not knowingly collect
          personal information from anyone under 18 years of age.
        </p>
      </LegalSection>

      <LegalSection title="9. Changes to This Policy">
        <p>
          We may update this policy from time to time. Material changes will be reflected by
          updating the &ldquo;Last updated&rdquo; date above.
        </p>
      </LegalSection>

      <LegalSection title="10. Contact Us">
        <p>
          For any privacy-related questions, reach us at{" "}
          <a href={`mailto:${siteConfig.contactEmail}`} className="text-foreground hover:underline">
            {siteConfig.contactEmail}
          </a>
          .
        </p>
      </LegalSection>
    </LegalPageShell>
  );
}
