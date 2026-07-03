import { createFileRoute, Link } from "@tanstack/react-router";
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
      { property: "og:description", content: "AI-powered donation, accounting and compliance management for Indian temples, trusts and NGOs." },
      { property: "og:url", content: "/" },
    ],
    links: [{ rel: "canonical", href: "/" }],
  }),
  component: Landing,
});

function TopNav() {
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
          <a href="#features" className="hover:text-foreground">Features</a>
          <a href="#how" className="hover:text-foreground">How AI works</a>
          <a href="#pricing" className="hover:text-foreground">Pricing</a>
          <a href="#faq" className="hover:text-foreground">FAQ</a>
          <a href="#contact" className="hover:text-foreground">Contact</a>
        </nav>
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" className="hidden rounded-full sm:inline-flex">
            <Link to="/auth" hash="signin">Sign in</Link>
          </Button>
          <Button asChild className="rounded-full">
            <Link to="/auth" hash="signup">
              Sign up <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 bg-grain opacity-60" />
      <div className="absolute -left-32 top-20 h-72 w-72 rounded-full bg-primary-soft blur-3xl" />
      <div className="absolute -right-32 top-40 h-72 w-72 rounded-full bg-accent blur-3xl" />
      <div className="relative mx-auto grid max-w-7xl gap-12 px-4 py-20 sm:px-6 lg:grid-cols-12 lg:py-28">
        <div className="lg:col-span-7">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-accent px-3 py-1.5 text-xs font-medium text-accent-foreground">
            <Sparkles className="h-3.5 w-3.5" /> AI-powered • Made for India
          </div>
          <h1 className="mt-5 font-display text-4xl font-semibold leading-[1.05] text-foreground sm:text-5xl lg:text-6xl">
            Finance & compliance, <span className="text-primary">made simple</span> for temples and trusts.
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-muted-foreground">
            TrustSaathi helps temples, trusts and NGOs manage donations, accounts, donors,
            and audit-ready reports — even from handwritten registers. No accounting jargon.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Button asChild size="lg" className="rounded-full px-7 text-base">
              <Link to="/dashboard">
                Digitize Your Temple in Minutes <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="rounded-full px-7 text-base">
              <a href="#how">See how it works</a>
            </Button>
          </div>
          <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-success" /> 80G & FCRA ready</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-success" /> Works in Hindi & English</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-success" /> Used by 200+ temples</span>
          </div>
        </div>

        <div className="lg:col-span-5">
          <div className="relative rounded-3xl border border-border bg-card p-2 shadow-card">
            <div className="rounded-2xl bg-gradient-to-br from-accent via-card to-card p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Jai Shree Krishna 🙏</p>
                  <p className="font-display text-lg font-semibold">Today's Snapshot</p>
                </div>
                <span className="rounded-full bg-success/10 px-2.5 py-1 text-xs font-medium text-success">Live</span>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3">
                {[
                  { label: "Donations", value: "₹2,84,500", delta: "+12.4%" },
                  { label: "Donors", value: "1,248", delta: "+38" },
                  { label: "Expenses", value: "₹74,210", delta: "-3.1%" },
                  { label: "Net Surplus", value: "₹2,10,290", delta: "+18%" },
                ].map((k) => (
                  <div key={k.label} className="rounded-xl border border-border bg-background p-3">
                    <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{k.label}</p>
                    <p className="mt-1 font-display text-lg font-semibold">{k.value}</p>
                    <p className="text-xs text-success">{k.delta}</p>
                  </div>
                ))}
              </div>

              <div className="mt-4 rounded-xl border border-border bg-background p-4">
                <div className="flex items-end gap-1.5">
                  {[40, 65, 50, 80, 60, 95, 72, 88, 70, 92, 78, 100].map((h, i) => (
                    <div key={i} className="flex-1 rounded-t bg-primary/80" style={{ height: `${h * 0.7}px` }} />
                  ))}
                </div>
                <p className="mt-2 text-xs text-muted-foreground">Monthly donations · ₹ in thousands</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Features() {
  const features = [
    { icon: HandCoins, title: "Donations & Receipts", desc: "Add donations in seconds and auto-generate printable 80G receipts." },
    { icon: Users, title: "Donor Management", desc: "One place for every donor — history, PAN, repeat donations and exports." },
    { icon: Receipt, title: "Income & Expenses", desc: "Simple categories. No accounting terms. Anyone on your team can use it." },
    { icon: Landmark, title: "Trust Accounting", desc: "Cash book, bank book, trial balance and balance sheet — done for you." },
    { icon: ShieldCheck, title: "Compliance Center", desc: "Audit readiness score, FCRA reminders and missing-document alerts." },
    { icon: Upload, title: "AI Document Upload", desc: "Upload handwritten registers, receipts or PDFs — AI does the data entry." },
    { icon: Building2, title: "Assets & Inventory", desc: "Track land, gold, vehicles, furniture and temple inventory in one register." },
    { icon: BarChart3, title: "Reports", desc: "PDF, Excel or CSV — donation, donor, expense and audit reports in one click." },
  ];
  return (
    <section id="features" className="border-t border-border bg-secondary/40">
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <div className="max-w-2xl">
          <p className="text-sm font-medium text-primary">Everything you need</p>
          <h2 className="mt-2 font-display text-3xl font-semibold sm:text-4xl">
            A complete finance system, designed for temples and trusts.
          </h2>
          <p className="mt-3 text-muted-foreground">
            Built with the trustee, accountant and pandit in mind. No clutter, no jargon.
          </p>
        </div>
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f) => (
            <Card key={f.title} className="rounded-2xl border-border p-6 shadow-soft transition hover:-translate-y-0.5 hover:shadow-card">
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
  const steps = [
    { n: "01", title: "Upload your registers", desc: "Snap photos of handwritten donation registers, bank statements or receipts." },
    { n: "02", title: "AI reads & organises", desc: "Our AI extracts donor names, amounts, dates and payment modes automatically." },
    { n: "03", title: "Review & approve", desc: "A trustee reviews the extracted entries in plain language and approves them." },
    { n: "04", title: "Reports in one click", desc: "Audit-ready reports, 80G receipts and compliance alerts — instantly." },
  ];
  return (
    <section id="how" className="border-t border-border">
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <div className="mandala-divider mx-auto mb-12 w-40" />
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-medium text-primary">How AI works</p>
          <h2 className="mt-2 font-display text-3xl font-semibold sm:text-4xl">
            From paper registers to clean accounts — in 4 simple steps.
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
  const items = [
    { name: "Shri Ramesh Joshi", role: "Trustee, Shree Ganesh Mandir, Pune", quote: "We digitised 20 years of donation registers in two weeks. Our auditor was very happy." },
    { name: "Sunita Iyer", role: "Accountant, Seva Foundation NGO", quote: "Even our senior volunteers can add donations. The 80G receipts are a blessing." },
    { name: "Pandit Mohan Sharma", role: "Pujari, Shri Hanuman Trust", quote: "I just take a photo of the register. TrustSaathi does the rest. Truly a saathi." },
  ];
  return (
    <section className="border-t border-border bg-accent/40">
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <h2 className="font-display text-3xl font-semibold sm:text-4xl">Trusted by temples and trusts across India</h2>
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {items.map((t) => (
            <Card key={t.name} className="rounded-2xl border-border bg-card p-6 shadow-soft">
              <div className="flex gap-1 text-primary">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-current" />
                ))}
              </div>
              <p className="mt-4 leading-relaxed text-foreground">"{t.quote}"</p>
              <div className="mt-5">
                <p className="font-semibold">{t.name}</p>
                <p className="text-sm text-muted-foreground">{t.role}</p>
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
