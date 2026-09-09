import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { siteConfig } from "@/config/site";

const FAQS = [
  {
    question: "How do I get the guide after I pay?",
    answer:
      "Access is instant. As soon as your payment is confirmed by Razorpay, a download link unlocks on your order confirmation page and in your account under My Orders — no waiting, no shipping.",
  },
  {
    question: "What format are the guides in?",
    answer:
      "Every guide is a downloadable PDF (some come with bonus worksheets as a ZIP). You can read it on your phone, tablet, or laptop, and keep it permanently once purchased.",
  },
  {
    question: "Is payment safe?",
    answer:
      `All payments are processed securely through Razorpay. ${siteConfig.name} never sees or stores your card, UPI, or bank details — see our Privacy Policy for details.`,
  },
  {
    question: "Can I get a refund?",
    answer:
      "Yes — see our Refund & Cancellation Policy for the full terms. Because these are instant-access digital products, refund eligibility has some conditions, which are laid out clearly there.",
  },
  {
    question: "Do I need to create an account to buy?",
    answer:
      "No — you can check out as a guest with just your email. You'll get your download link on the confirmation page and by email. Creating a free account is optional and just gives you a permanent order history.",
  },
];

export function Faq() {
  return (
    <section className="border-t border-border bg-secondary/30">
      <div className="mx-auto max-w-(--breakpoint-md) px-6 py-16 md:px-16">
        <div className="mb-10 flex flex-col items-center gap-2 text-center">
          <span className="text-sm font-medium tracking-wide text-primary uppercase">FAQ</span>
          <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
            Common Questions
          </h2>
        </div>
        <Accordion>
          {FAQS.map((faq, i) => (
            <AccordionItem key={faq.question} value={i}>
              <AccordionTrigger>{faq.question}</AccordionTrigger>
              <AccordionContent>
                <p className="pb-3 text-sm text-muted-foreground">{faq.answer}</p>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
