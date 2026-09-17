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
  title: `Terms & Conditions — ${siteConfig.name}`,
  description: `The terms governing your use of ${siteConfig.name} and the digital products we sell.`,
};

export default function TermsPage() {
  return (
    <LegalPageShell title="Terms & Conditions" lastUpdated="September 17, 2026">
      <p>
        These Terms &amp; Conditions (&ldquo;Terms&rdquo;) are a binding agreement between you
        and {siteConfig.legalName}, covering your use of {siteConfig.url} and any digital
        product you buy from us. By placing an order or creating an account, you confirm you
        have read and accept these Terms. If you do not accept them, please do not use the
        site.
      </p>

      <SellerIdentity />

      <LegalSection title="1. Eligibility">
        <p>
          You must be at least 18 years old and legally capable of entering into a contract
          under the Indian Contract Act, 1872. By ordering, you confirm that you are.
        </p>
      </LegalSection>

      <LegalSection title="2. Accounts and Guest Checkout">
        <p>
          You may buy as a guest using only a valid email address, or create an account for a
          permanent purchase history and faster checkout. Either way, the email address you
          give us is how we deliver your purchase — if it is wrong or unreachable, we cannot
          deliver, and that is not a ground for refund.
        </p>
        <p>
          You are responsible for keeping your account credentials confidential and for
          activity carried out under your account. Tell us immediately if you suspect
          unauthorised use. Guest purchases are reached through a permanent secret link sent
          to your email — treat that link like a password, because anyone holding it can
          download your files.
        </p>
      </LegalSection>

      <LegalSection title="3. What You Are Buying">
        <p>
          Our products are digital spreadsheet templates, delivered as Microsoft Excel
          (.xlsx) files, occasionally bundled with additional sheets in a ZIP archive. They
          are files — not a service, a subscription, or coaching.
        </p>
        <p>
          You need your own spreadsheet application — such as Microsoft Excel, Google Sheets
          or Apple Numbers — to open them. We do not supply that software and are not
          responsible for it. Some formatting, charts or formulas may behave differently
          across applications and versions. The product description tells you what each file
          contains, and you are responsible for checking that it suits your needs before
          buying.
        </p>
      </LegalSection>

      <LegalSection title="4. Your Licence to Use Our Products">
        <p>
          On full payment, we grant you a personal, non-exclusive, non-transferable, perpetual
          licence to use the files you bought for your own personal, non-commercial purposes.
          You may keep copies on your own devices and make backups. You do not acquire
          ownership of the files or of any intellectual property in them.
        </p>
        <p>You may not:</p>
        <LegalList
          items={[
            "Resell, sublicense, rent, lend, distribute or otherwise share the files with anyone else",
            "Upload them to file-sharing sites, public repositories, messaging groups or forums",
            "Publish them, in whole or in part, as your own work or as part of another product",
            "Remove or obscure any branding, copyright notice or attribution in the files",
            "Use them, or any part of them, for any unlawful purpose",
          ]}
        />
        <p>
          If you breach this section, the licence terminates automatically and we may suspend
          your account and withdraw access without a refund, in addition to any other remedy
          available to us in law.
        </p>
      </LegalSection>

      <LegalSection title="5. Prices, Taxes and Payment">
        <p>
          All prices are shown in Indian Rupees (INR) and are inclusive of any Goods and
          Services Tax that applies to the sale. Any strike-through price shown next to a
          product is its usual list price, and the saving shown is calculated against that
          price.
        </p>
        <p>
          Payment is taken through Razorpay at the time of the order; we do not offer credit
          or instalments. Your order is confirmed only once Razorpay reports the payment as
          successful. We may change prices or run promotions at any time, but a change never
          affects an order already paid for.
        </p>
        <p>
          If a product is listed at an obviously incorrect price because of a clerical or
          technical error, we may cancel the order and refund you in full rather than supply
          at that price.
        </p>
      </LegalSection>

      <LegalSection title="6. Delivery, Cancellation and Refunds">
        <p>
          Delivery is immediate and electronic — see our{" "}
          <Link href="/shipping-policy" className="text-foreground hover:underline">
            Shipping &amp; Delivery Policy
          </Link>
          . Because access is unlocked instantly, cancellation and refund rights are limited
          and are set out in full in our{" "}
          <Link href="/refund-policy" className="text-foreground hover:underline">
            Refund &amp; Cancellation Policy
          </Link>
          , which forms part of these Terms.
        </p>
      </LegalSection>

      <LegalSection title="7. Reviews and Anything Else You Post">
        <p>
          If you have bought a product, you may submit a review of it. Reviews are moderated
          before they appear, and we may decline or remove any review that is unlawful,
          abusive, defamatory, misleading, off-topic, promotional, or that discloses someone
          else&apos;s personal information. Moderation does not make us the author of a
          review, and published reviews are the opinions of the customers who wrote them.
        </p>
        <p>
          By submitting a review you confirm it is your genuine opinion based on an actual
          purchase, and you grant us a non-exclusive, royalty-free, worldwide licence to
          display, reproduce and adapt it in connection with the product and our marketing,
          alongside your display name. You can ask us to remove your review at any time.
        </p>
      </LegalSection>

      <LegalSection title="8. Acceptable Use">
        <p>You agree not to:</p>
        <LegalList
          items={[
            "Attempt to gain unauthorised access to our systems, another user's account, or any file you have not paid for",
            "Probe, scan, overload or otherwise interfere with the normal operation of the site",
            "Use automated means to scrape, copy or harvest content or customer data from the site",
            "Submit false, stolen or fraudulent payment information, or impersonate anyone else",
            "Circumvent, or attempt to circumvent, the access controls protecting our product files",
          ]}
        />
      </LegalSection>

      <LegalSection title="9. Health and Wellness Disclaimer">
        <p>
          <strong>
            Our trackers are self-management tools. They are not medical devices and they are
            not medical advice.
          </strong>{" "}
          They include calorie targets, macronutrient splits, BMI and body-fat estimates and
          training logs. These are general-purpose calculations based on figures you enter
          yourself. They are not tailored to you, they are not reviewed by a clinician, and
          they can be inaccurate for any given individual.
        </p>
        <p>
          Always consult a qualified doctor, dietitian or other healthcare professional before
          starting or changing any exercise programme or diet — and especially if you are
          pregnant, under 18, elderly, recovering from injury or surgery, living with a
          medical condition such as diabetes or heart disease, taking medication, or have any
          history of disordered eating. Stop and seek medical advice if you feel unwell.
        </p>
        <p>
          Nothing in our products diagnoses, treats, cures or prevents any condition. Results
          differ from person to person and we do not promise any particular outcome. You use
          these tools at your own risk and remain responsible for your own health decisions.
        </p>
      </LegalSection>

      <LegalSection title="10. Intellectual Property">
        <p>
          All content on this site and in our products — including the spreadsheet templates,
          their structure, formulas and charts, together with our text, graphics, logos and
          branding — is owned by {siteConfig.legalName} or used under licence, and is protected
          by the Copyright Act, 1957 and applicable trade mark law. Buying a product licenses
          its use under section 4 and transfers no ownership.
        </p>
      </LegalSection>

      <LegalSection title="11. Availability and Changes">
        <p>
          We aim to keep the site available but do not guarantee uninterrupted access —
          maintenance, provider outages and events beyond our control can interrupt it. We may
          add, change, withdraw or stop selling any product at any time. Withdrawing a product
          from sale does not remove your access to a copy you have already bought.
        </p>
      </LegalSection>

      <LegalSection title="12. Warranties and Limitation of Liability">
        <p>
          We warrant that the files we deliver will materially match their description on the
          site. Beyond that, and to the maximum extent permitted by law, our products are
          supplied &ldquo;as is&rdquo; without any further warranty of accuracy, fitness for a
          particular purpose, or uninterrupted availability.
        </p>
        <p>
          To the maximum extent permitted by law, we are not liable for any indirect,
          incidental, special or consequential loss, nor for loss of profit, of data, or of
          the information you enter into the spreadsheets. Our total liability arising out of
          or in connection with any order is limited to the amount you actually paid for that
          order.
        </p>
        <p>
          Nothing in these Terms excludes or limits liability that cannot lawfully be excluded
          — including liability for death or personal injury caused by our negligence, or for
          fraud — and nothing here affects the rights you have under the Consumer Protection
          Act, 2019.
        </p>
      </LegalSection>

      <LegalSection title="13. Suspension and Termination">
        <p>
          We may suspend or close your account if you breach these Terms, if we reasonably
          suspect fraud or payment abuse, or if we are required to by law. Where it is
          reasonable to do so, we will tell you why and give you a chance to respond. You may
          close your account at any time by emailing us. The sections covering licence
          restrictions, intellectual property, disclaimers, liability and governing law
          survive termination.
        </p>
      </LegalSection>

      <LegalSection title="14. Governing Law and Disputes">
        <p>
          These Terms are governed by the laws of India. Subject to the consumer rights you
          have under the Consumer Protection Act, 2019 — which may allow you to bring a
          complaint where you live — the courts at Kochi, Kerala have exclusive jurisdiction
          over any dispute arising from these Terms or your use of the site.
        </p>
        <p>
          Please contact us first: most issues are resolved quickly by email without anyone
          needing to go further.
        </p>
      </LegalSection>

      <LegalSection title="15. Changes to These Terms">
        <p>
          We may revise these Terms from time to time, and the &ldquo;Last updated&rdquo; date
          above will change when we do. The Terms that apply to your order are the ones in
          force at the moment you place it. Continuing to use the site after a change means
          you accept the revised Terms.
        </p>
      </LegalSection>

      <LegalSection title="16. Contact">
        <p>
          Questions about these Terms, or any complaint, can be sent to{" "}
          <a href={`mailto:${siteConfig.contactEmail}`} className="text-foreground hover:underline">
            {siteConfig.contactEmail}
          </a>
          . See also our{" "}
          <Link href="/privacy-policy" className="text-foreground hover:underline">
            Privacy Policy
          </Link>
          .
        </p>
      </LegalSection>
    </LegalPageShell>
  );
}
