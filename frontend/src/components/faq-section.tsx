import { useTranslation } from "react-i18next";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

type FAQSectionProps = {
  embedded?: boolean;
};

export function FAQSection({ embedded }: FAQSectionProps) {
  const { t } = useTranslation();

  const items = [
    { q: t("faq.q1"), a: t("faq.a1") },
    { q: t("faq.q2"), a: t("faq.a2") },
    { q: t("faq.q3"), a: t("faq.a3") },
    { q: t("faq.q4"), a: t("faq.a4") },
    { q: t("faq.q5"), a: t("faq.a5") },
    { q: t("faq.q6"), a: t("faq.a6") },
  ];

  return (
    <section
      id="faq"
      className={
        embedded
          ? "rounded-2xl border border-border bg-secondary/40 px-4 py-2 sm:px-6"
          : "border-t border-border bg-secondary/40"
      }
    >
      <div className={embedded ? "py-10" : "mx-auto max-w-3xl px-4 py-20 sm:px-6"}>
        <h2 className="font-display text-3xl font-semibold sm:text-4xl">{t("faq.title")}</h2>
        <Accordion type="single" collapsible className="mt-8">
          {items.map((it, i) => (
            <AccordionItem key={i} value={`item-${i}`} className="border-border">
              <AccordionTrigger className="text-left text-base font-medium">
                {it.q}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">{it.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
