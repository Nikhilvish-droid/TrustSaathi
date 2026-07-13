import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type PricingSectionProps = {
  embedded?: boolean;
};

export function PricingSection({ embedded }: PricingSectionProps) {
  const { t } = useTranslation();

  const tiers = [
    {
      name: t("pricing.sevak.name"),
      price: "₹0",
      period: "/forever",
      desc: t("pricing.sevak.desc"),
      features: t("pricing.sevak.features", { returnObjects: true }) as string[],
      cta: t("pricing.sevak.cta"),
      featured: false,
    },
    {
      name: t("pricing.trust.name"),
      price: "₹1,499",
      period: "/month",
      desc: t("pricing.trust.desc"),
      features: t("pricing.trust.features", { returnObjects: true }) as string[],
      cta: t("pricing.trust.cta"),
      featured: true,
    },
    {
      name: t("pricing.sanstha.name"),
      price: "Custom",
      period: "",
      desc: t("pricing.sanstha.desc"),
      features: t("pricing.sanstha.features", { returnObjects: true }) as string[],
      cta: t("pricing.sanstha.cta"),
      featured: false,
    },
  ];

  return (
    <section
      id="pricing"
      className={embedded ? "border-t border-border pt-10" : "border-t border-border"}
    >
      <div className={embedded ? "py-10" : "mx-auto max-w-7xl px-4 py-20 sm:px-6"}>
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-medium text-primary">{t("pricing.label")}</p>
          <h2 className="mt-2 font-display text-3xl font-semibold sm:text-4xl">
            {t("pricing.title")}
          </h2>
          <p className="mt-3 text-muted-foreground">{t("pricing.subtitle")}</p>
        </div>
        <div className="mt-12 grid gap-4 lg:grid-cols-3">
          {tiers.map((tier) => (
            <Card
              key={tier.name}
              className={`relative rounded-2xl p-7 shadow-soft ${
                tier.featured
                  ? "border-primary bg-card ring-1 ring-primary/30"
                  : "border-border bg-card"
              }`}
            >
              {tier.featured && (
                <span className="absolute -top-3 left-7 rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground">
                  {t("pricing.mostPopular")}
                </span>
              )}
              <h3 className="font-display text-xl font-semibold">{tier.name}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{tier.desc}</p>
              <div className="mt-5 flex items-baseline gap-1">
                <span className="font-display text-4xl font-semibold">{tier.price}</span>
                <span className="text-sm text-muted-foreground">{tier.period}</span>
              </div>
              <ul className="mt-6 space-y-2.5 text-sm">
                {tier.features.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <Button
                asChild
                className="mt-7 w-full rounded-full"
                variant={tier.featured ? "default" : "outline"}
              >
                {tier.cta === t("pricing.sanstha.cta") ? (
                  <a href="tel:+919999999999">{tier.cta}</a>
                ) : embedded ? (
                  <a href="mailto:hello@trustsaathi.in">{tier.cta}</a>
                ) : (
                  <Link to="/dashboard">{tier.cta}</Link>
                )}
              </Button>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
