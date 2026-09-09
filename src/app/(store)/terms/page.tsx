import type { Metadata } from "next";
import { siteConfig } from "@/config/site";
import { LegalPageShell, LegalSection, LegalList } from "@/components/storefront/legal-page";

export const metadata: Metadata = {
  title: `Terms & Conditions — ${siteConfig.name}`,
  description: `The terms governing your use of ${siteConfig.name} and the digital products we sell.`,
};

export default function TermsPage() {
  return (
    <LegalPageShell title="Terms & Conditions" lastUpdated="September 8, 2026">
      <p>
        These Terms & Conditions (&ldquo;Terms&rdquo;) govern your access to and use of{" "}
        {siteConfig.url} and any digital products purchased from us. By creating an account or
        placing an order, you agree to be bound by these Terms.
      </p>

      <LegalSection title="1. Eligibility">
        <p>
          Our products are intended for adults. By using this site, you confirm you are at
          least 18 years old and legally able to enter into a binding contract.
        </p>
      </LegalSection>

      <LegalSection title="2. Account Registration">
        <p>
          You can purchase as a guest using just a valid email address, or create an account
          for permanent order history and faster future checkouts. If you do create an
          account, you&apos;re responsible for keeping your login credentials secure and for
          all activity that happens under it. Either way, provide an accurate email address —
          it&apos;s how we deliver your purchase and any order-related communication.
        </p>
      </LegalSection>

      <LegalSection title="3. Digital Products & License">
        <p>
          All guides sold on this site are digital products delivered as PDF or ZIP files. When
          you purchase a product, we grant you a personal, non-transferable, non-exclusive
          license to download and use it for your own personal use.
        </p>
        <p>You may not:</p>
        <LegalList
          items={[
            "Resell, redistribute, or share purchased files with anyone else",
            "Upload our content to file-sharing sites or public forums",
            "Modify, reproduce, or create derivative works from our content for distribution",
            "Use our content for any unlawful purpose",
          ]}
        />
        <p>Violating this section may result in your account being suspended without refund.</p>
      </LegalSection>

      <LegalSection title="4. Pricing & Payment">
        <p>
          All prices are listed in Indian Rupees (INR) and are inclusive of applicable taxes
          unless stated otherwise. Payments are processed securely through Razorpay. We reserve
          the right to change prices at any time; changes will not affect orders already
          placed.
        </p>
      </LegalSection>

      <LegalSection title="5. Intellectual Property">
        <p>
          All content on this site — including guide text, graphics, logos, and branding — is
          the property of {siteConfig.name} and is protected by applicable copyright and
          trademark law. Purchasing a product does not transfer ownership of that intellectual
          property to you.
        </p>
      </LegalSection>

      <LegalSection title="6. Prohibited Use">
        <p>You agree not to use this site to:</p>
        <LegalList
          items={[
            "Attempt to gain unauthorized access to our systems or another user's account",
            "Interfere with the normal operation of the website",
            "Submit false or fraudulent payment information",
          ]}
        />
      </LegalSection>

      <LegalSection title="7. Limitation of Liability">
        <p>
          Our guides provide general educational and self-improvement content and are not a
          substitute for professional medical, psychological, financial, or legal advice.
          Results vary by individual, and we make no guarantee of specific outcomes. To the
          maximum extent permitted by law, {siteConfig.name} is not liable for any indirect,
          incidental, or consequential damages arising from your use of our products.
        </p>
      </LegalSection>

      <LegalSection title="8. Governing Law">
        <p>
          These Terms are governed by the laws of India. Any disputes arising from these Terms
          or your use of the site will be subject to the exclusive jurisdiction of the courts
          of Kerala, India.
        </p>
      </LegalSection>

      <LegalSection title="9. Changes to These Terms">
        <p>
          We may revise these Terms from time to time. Continued use of the site after changes
          are posted constitutes acceptance of the revised Terms.
        </p>
      </LegalSection>

      <LegalSection title="10. Contact Us">
        <p>
          Questions about these Terms can be sent to{" "}
          <a href={`mailto:${siteConfig.contactEmail}`} className="text-foreground hover:underline">
            {siteConfig.contactEmail}
          </a>
          .
        </p>
      </LegalSection>
    </LegalPageShell>
  );
}
