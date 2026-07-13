import { createFileRoute, Link } from "@tanstack/react-router";
import { useTranslation, Trans } from "react-i18next";
import {
  Sparkles,
  ShieldCheck,
  Receipt,
  Users,
  FileText,
  Building2,
  Upload,
  CheckCircle2,
  Star,
  ArrowRight,
  Flower2,
  HandCoins,
  Landmark,
  BarChart3,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PricingSection } from "@/components/pricing-section";
import { FAQSection } from "@/components/faq-section";
import { SiteFooter } from "@/components/site-footer";
import { LanguageSwitcher } from "@/components/language-switcher";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "TrustSaathi — Temple, Trust & NGO Finance Software (India)" },
      {
        name: "description",
        content:
          "Digitize your temple, trust or NGO in minutes. Manage donations, accounts, donors and audit reports with AI — built for India.",
      },
      { property: "og:title", content: "TrustSaathi — Temple, Trust & NGO Finance Software" },
      {
        property: "og:description",
        content:
          "AI-powered donation, accounting and compliance management for Indian temples, trusts and NGOs.",
      },
      { property: "og:url", content: "/" },
    ],
    links: [{ rel: "canonical", href: "/" }],
  }),
  component: Landing,
});

function TopNav() {
  const { t } = useTranslation();
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        <Link to="/" className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-primary-foreground shadow-soft">
            <Flower2 className="h-5 w-5" />
          </span>
          <span className="font-display text-xl font-semibold">TrustSaathi</span>
        </Link>
        <nav className="hidden items-center gap-8 text-sm text-muted-foreground md:flex">
          <a href="#features" className="hover:text-foreground">
            {t("nav.features")}
          </a>
          <a href="#how" className="hover:text-foreground">
            {t("nav.howItWorks")}
          </a>
          <a href="#pricing" className="hover:text-foreground">
            {t("nav.pricing")}
          </a>
          <a href="#faq" className="hover:text-foreground">
            {t("nav.faq")}
          </a>
          <a href="#contact" className="hover:text-foreground">
            {t("nav.contact")}
          </a>
        </nav>
        <div className="flex items-center gap-2">
          <LanguageSwitcher className="mr-1" />
          <Button asChild variant="ghost" className="hidden rounded-full sm:inline-flex">
            <Link to="/auth" hash="signin">
              {t("nav.signIn")}
            </Link>
          </Button>
          <Button asChild className="rounded-full">
            <Link to="/auth" hash="signup">
              {t("nav.signUp")} <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}

function Hero() {
  const { t } = useTranslation();
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 bg-grain opacity-60" />
      <div className="absolute -left-32 top-20 h-72 w-72 rounded-full bg-primary-soft blur-3xl" />
      <div className="absolute -right-32 top-40 h-72 w-72 rounded-full bg-accent blur-3xl" />
      <div className="relative mx-auto grid max-w-7xl gap-12 px-4 py-20 sm:px-6 lg:grid-cols-12 lg:py-28">
        <div className="lg:col-span-7">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-accent px-3 py-1.5 text-xs font-medium text-accent-foreground">
            <Sparkles className="h-3.5 w-3.5" /> {t("hero.badge")}
          </div>
          <h1 className="mt-5 font-display text-4xl font-semibold leading-[1.05] text-foreground sm:text-5xl lg:text-6xl">
            <Trans i18nKey="hero.title" components={{ 1: <span className="text-primary" /> }} />
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-muted-foreground">
            {t("hero.subtitle")}
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Button asChild size="lg" className="rounded-full px-7 text-base">
              <Link to="/dashboard">
                {t("hero.cta")} <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="rounded-full px-7 text-base">
              <a href="#how">{t("hero.ctaSecondary")}</a>
            </Button>
          </div>
          <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-success" /> {t("hero.bullet1")}
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-success" /> {t("hero.bullet2")}
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-success" /> {t("hero.bullet3")}
            </span>
          </div>
        </div>

        <div className="lg:col-span-5">
          <div className="relative rounded-3xl border border-border bg-card p-2 shadow-card">
            <div className="rounded-2xl bg-gradient-to-br from-accent via-card to-card p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">{t("dashboard.greeting")}</p>
                  <p className="font-display text-lg font-semibold">{t("hero.snapshotTitle")}</p>
                </div>
                <span className="rounded-full bg-success/10 px-2.5 py-1 text-xs font-medium text-success">
                  {t("hero.live")}
                </span>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3">
                {[
                  { label: t("hero.donations"), value: "₹2,84,500", delta: "+12.4%" },
                  { label: t("hero.donors"), value: "1,248", delta: "+38" },
                  { label: t("hero.expenses"), value: "₹74,210", delta: "-3.1%" },
                  { label: t("hero.netSurplus"), value: "₹2,10,290", delta: "+18%" },
                ].map((k) => (
                  <div key={k.label} className="rounded-xl border border-border bg-background p-3">
                    <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                      {k.label}
                    </p>
                    <p className="mt-1 font-display text-lg font-semibold">{k.value}</p>
                    <p className="text-xs text-success">{k.delta}</p>
                  </div>
                ))}
              </div>

              <div className="mt-4 rounded-xl border border-border bg-background p-4">
                <div className="flex items-end gap-1.5">
                  {[40, 65, 50, 80, 60, 95, 72, 88, 70, 92, 78, 100].map((h, i) => (
                    <div
                      key={i}
                      className="flex-1 rounded-t bg-primary/80"
                      style={{ height: `${h * 0.7}px` }}
                    />
                  ))}
                </div>
                <p className="mt-2 text-xs text-muted-foreground">{t("hero.monthlyDonations")}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Features() {
  const { t } = useTranslation();
  const features = [
    { icon: HandCoins, title: t("features.donationsTitle"), desc: t("features.donationsDesc") },
    { icon: Users, title: t("features.donorsTitle"), desc: t("features.donorsDesc") },
    { icon: Receipt, title: t("features.incomeTitle"), desc: t("features.incomeDesc") },
    { icon: Landmark, title: t("features.trustTitle"), desc: t("features.trustDesc") },
    { icon: ShieldCheck, title: t("features.auditTitle"), desc: t("features.auditDesc") },
    { icon: Upload, title: t("features.uploadTitle"), desc: t("features.uploadDesc") },
    { icon: Building2, title: t("features.assetsTitle"), desc: t("features.assetsDesc") },
    { icon: BarChart3, title: t("features.reportsTitle"), desc: t("features.reportsDesc") },
  ];
  return (
    <section id="features" className="border-t border-border bg-secondary/40">
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <div className="max-w-2xl">
          <p className="text-sm font-medium text-primary">{t("features.label")}</p>
          <h2 className="mt-2 font-display text-3xl font-semibold sm:text-4xl">
            {t("features.title")}
          </h2>
          <p className="mt-3 text-muted-foreground">{t("features.subtitle")}</p>
        </div>
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f) => (
            <Card
              key={f.title}
              className="rounded-2xl border-border p-6 shadow-soft transition hover:-translate-y-0.5 hover:shadow-card"
            >
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-accent text-primary">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-lg font-semibold">{f.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowAI() {
  const { t } = useTranslation();
  const steps = [
    { n: "01", title: t("howItWorks.step1Title"), desc: t("howItWorks.step1Desc") },
    { n: "02", title: t("howItWorks.step2Title"), desc: t("howItWorks.step2Desc") },
    { n: "03", title: t("howItWorks.step3Title"), desc: t("howItWorks.step3Desc") },
    { n: "04", title: t("howItWorks.step4Title"), desc: t("howItWorks.step4Desc") },
  ];
  return (
    <section id="how" className="border-t border-border">
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <div className="mandala-divider mx-auto mb-12 w-40" />
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-medium text-primary">{t("howItWorks.label")}</p>
          <h2 className="mt-2 font-display text-3xl font-semibold sm:text-4xl">
            {t("howItWorks.title")}
          </h2>
        </div>
        <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {steps.map((s) => (
            <div key={s.n} className="rounded-2xl border border-border bg-card p-6 shadow-soft">
              <p className="font-display text-3xl font-semibold text-primary">{s.n}</p>
              <h3 className="mt-3 text-lg font-semibold">{s.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Testimonials() {
  const { t } = useTranslation();
  const items = [
    {
      name: t("testimonials.name1"),
      role: t("testimonials.role1"),
      quote: t("testimonials.quote1"),
    },
    {
      name: t("testimonials.name2"),
      role: t("testimonials.role2"),
      quote: t("testimonials.quote2"),
    },
    {
      name: t("testimonials.name3"),
      role: t("testimonials.role3"),
      quote: t("testimonials.quote3"),
    },
  ];
  return (
    <section className="border-t border-border bg-accent/40">
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <h2 className="font-display text-3xl font-semibold sm:text-4xl">
          {t("testimonials.title")}
        </h2>
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {items.map((tItem) => (
            <Card key={tItem.name} className="rounded-2xl border-border bg-card p-6 shadow-soft">
              <div className="flex gap-1 text-primary">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-current" />
                ))}
              </div>
              <p className="mt-4 leading-relaxed text-foreground">"{tItem.quote}"</p>
              <div className="mt-5">
                <p className="font-semibold">{tItem.name}</p>
                <p className="text-sm text-muted-foreground">{tItem.role}</p>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <TopNav />
      <main>
        <Hero />
        <Features />
        <HowAI />
        <Testimonials />
        <PricingSection />
        <FAQSection />
      </main>
      <SiteFooter variant="landing" />
    </div>
  );
}
