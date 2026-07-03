import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const items = [
  {
    q: "Do I need accounting knowledge to use TrustSaathi?",
    a: "Not at all. We've removed every accounting term and replaced them with simple words. If you can use WhatsApp, you can use TrustSaathi.",
  },
  {
    q: "Can AI really read our handwritten donation registers?",
    a: "Yes. Upload a clear photo or scan. Our AI extracts donor name, amount, date and payment mode. A trustee reviews and approves before anything is saved.",
  },
  {
    q: "Is my data safe?",
    a: "Your data is encrypted and stored securely. Only the users you invite can see it. Role-based access ensures auditors only get read access.",
  },
  {
    q: "Can we generate 80G receipts?",
    a: "Yes, in one click. You can customise the temple seal, trustee signature and receipt format.",
  },
  {
    q: "Do you support FCRA reporting?",
    a: "Yes, the Sanstha plan includes FCRA-ready statements and reminders for filing deadlines.",
  },
  {
    q: "Is there a free plan?",
    a: "Yes. The Sevak plan is free forever for small temples up to 100 donations per month.",
  },
];

type FAQSectionProps = {
  embedded?: boolean;
};

export function FAQSection({ embedded }: FAQSectionProps) {
  return (
    <section
      id="faq"
      className={embedded ? "rounded-2xl border border-border bg-secondary/40 px-4 py-2 sm:px-6" : "border-t border-border bg-secondary/40"}
    >
      <div className={embedded ? "py-10" : "mx-auto max-w-3xl px-4 py-20 sm:px-6"}>
        <h2 className="font-display text-3xl font-semibold sm:text-4xl">Frequently asked questions</h2>
        <Accordion type="single" collapsible className="mt-8">
          {items.map((it, i) => (
            <AccordionItem key={i} value={`item-${i}`} className="border-border">
              <AccordionTrigger className="text-left text-base font-medium">{it.q}</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">{it.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
