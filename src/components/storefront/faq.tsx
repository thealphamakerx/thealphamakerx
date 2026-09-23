import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { siteConfig } from "@/config/site";

const FAQS = [
  {
    question: "How do I get my guide after I pay?",
    answer:
      "Instantly. As soon as Cashfree confirms your payment, the download unlocks on your order confirmation page, the link is emailed to you, and it stays under My Orders — no waiting, no shipping.",
  },
  {
    question: "What format are the guides in?",
    answer:
      "Every guide is a downloadable ebook you can read on your phone, tablet or laptop. It's yours to keep once purchased.",
  },
  {
    question: "Is my purchase private?",
    answer:
      "Yes. Your download link goes only to the email you enter at checkout, and nothing is shipped to your address. Payments show up through Cashfree, not with the guide's title.",
  },
  {
    question: "I don't have much experience with women. Are these for me?",
    answer:
      "Yes. The guides are written for ordinary men — you don't need looks, money or a long dating history to use them. They start from the basics and build step by step.",
  },
  {
    question: "Is payment safe?",
    answer:
      `All payments are processed securely through Cashfree — UPI, cards and net banking. ${siteConfig.name} never sees or stores your card, UPI, or bank details.`,
  },
  {
    question: "Do I need to create an account to buy?",
    answer:
      "No — there are no accounts. You check out with just your email, and can see all your purchases any time under My Orders.",
  },
  {
    question: "Can I get a refund?",
    answer:
      "See our Refund & Cancellation Policy for the full terms. Because these are instant-access digital products, refund eligibility has some conditions, which are laid out clearly there.",
  },
];

export function Faq() {
  return (
    <section className="border-t border-border bg-secondary/30">
      <div className="mx-auto max-w-(--breakpoint-md) px-6 py-24 md:px-16">
        <div className="mb-10 flex flex-col items-center gap-2 text-center">
          <span className="text-sm font-medium tracking-wide text-primary uppercase">FAQ</span>
          <h2 className="text-2xl font-semibold tracking-tight md:text-4xl">
            Common Questions
          </h2>
        </div>
        <Accordion>
          {FAQS.map((faq, i) => (
            <AccordionItem key={faq.question} value={i}>
              <AccordionTrigger>{faq.question}</AccordionTrigger>
              <AccordionContent>
                <p className="pb-3 text-base leading-relaxed text-muted-foreground">{faq.answer}</p>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
