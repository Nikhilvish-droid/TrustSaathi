import { Link } from "@tanstack/react-router";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const tiers = [
  {
    name: "Sevak",
    price: "₹0",
    period: "/forever",
    desc: "For small temples just getting started.",
    features: ["Up to 100 donations / month", "1 user", "Basic reports", "Email support"],
    cta: "Start free",
    featured: false,
  },
  {
    name: "Trust",
    price: "₹1,499",
    period: "/month",
    desc: "Most popular for temples and mid-sized trusts.",
    features: ["Unlimited donations", "5 users", "AI register upload", "80G receipts", "Compliance center"],
    cta: "Choose Trust",
    featured: true,
  },
  {
    name: "Sanstha",
    price: "Custom",
    period: "",
    desc: "For large NGOs and trust networks.",
    features: ["Unlimited users", "Multi-branch", "FCRA reporting", "Dedicated manager"],
    cta: "Talk to us",
    featured: false,
  },
];

type PricingSectionProps = {
  embedded?: boolean;
};

export function PricingSection({ embedded }: PricingSectionProps) {
  return (
    <section id="pricing" className={embedded ? "border-t border-border pt-10" : "border-t border-border"}>
      <div className={embedded ? "py-10" : "mx-auto max-w-7xl px-4 py-20 sm:px-6"}>
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-medium text-primary">Pricing</p>
          <h2 className="mt-2 font-display text-3xl font-semibold sm:text-4xl">Honest pricing. No surprises.</h2>
          <p className="mt-3 text-muted-foreground">Free for small temples. Pay only when you grow.</p>
        </div>
        <div className="mt-12 grid gap-4 lg:grid-cols-3">
          {tiers.map((t) => (
            <Card
              key={t.name}
              className={`relative rounded-2xl p-7 shadow-soft ${
                t.featured ? "border-primary bg-card ring-1 ring-primary/30" : "border-border bg-card"
              }`}
            >
              {t.featured && (
                <span className="absolute -top-3 left-7 rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground">
                  Most Popular
                </span>
              )}
              <h3 className="font-display text-xl font-semibold">{t.name}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{t.desc}</p>
              <div className="mt-5 flex items-baseline gap-1">
                <span className="font-display text-4xl font-semibold">{t.price}</span>
                <span className="text-sm text-muted-foreground">{t.period}</span>
              </div>
              <ul className="mt-6 space-y-2.5 text-sm">
                {t.features.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <Button asChild className="mt-7 w-full rounded-full" variant={t.featured ? "default" : "outline"}>
                {t.cta === "Talk to us" ? (
                  <a href="tel:+919999999999">{t.cta}</a>
                ) : embedded ? (
                  <a href="mailto:hello@trustsaathi.in">{t.cta}</a>
                ) : (
                  <Link to="/dashboard">{t.cta}</Link>
                )}
              </Button>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
