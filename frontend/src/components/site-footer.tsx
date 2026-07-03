import { Link } from "@tanstack/react-router";
import { ArrowRight, FileText, Flower2, Mail, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";

type SiteFooterProps = {
  variant?: "landing" | "dashboard";
};

export function SiteFooter({ variant = "dashboard" }: SiteFooterProps) {
  return (
    <footer className="border-t border-border bg-secondary/40">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-accent via-card to-card p-8 shadow-card sm:p-12">
          <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
            <div>
              <h2 className="font-display text-2xl font-semibold sm:text-3xl">
                Digitize your temple in minutes 🙏
              </h2>
              <p className="mt-3 max-w-lg text-muted-foreground">
                Join 200+ temples, trusts and NGOs already running on TrustSaathi.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                {variant === "landing" ? (
                  <Button asChild size="lg" className="rounded-full px-7">
                    <Link to="/dashboard">
                      Open Dashboard <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                ) : (
                  <Button asChild size="lg" className="rounded-full px-7">
                    <Link to="/dashboard/upload">
                      Upload documents <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                )}
                <Button asChild size="lg" variant="outline" className="rounded-full px-7">
                  <a href="tel:+919999999999">Talk to us</a>
                </Button>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-border bg-background p-5">
                <Phone className="h-5 w-5 text-primary" />
                <p className="mt-3 text-sm text-muted-foreground">Call us</p>
                <p className="font-medium">+91 99999 99999</p>
              </div>
              <div className="rounded-2xl border border-border bg-background p-5">
                <Mail className="h-5 w-5 text-primary" />
                <p className="mt-3 text-sm text-muted-foreground">Email</p>
                <p className="font-medium">hello@trustsaathi.in</p>
              </div>
              <div className="rounded-2xl border border-border bg-background p-5 sm:col-span-2">
                <FileText className="h-5 w-5 text-primary" />
                <p className="mt-3 text-sm text-muted-foreground">Office</p>
                <p className="font-medium">Pune, Maharashtra, India</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-primary-foreground">
              <Flower2 className="h-4 w-4" />
            </span>
            <span className="font-display text-lg font-semibold">TrustSaathi</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} TrustSaathi. Made with 🙏 in India.
          </p>
        </div>
      </div>
    </footer>
  );
}
