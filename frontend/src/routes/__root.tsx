import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { useTranslation } from "react-i18next";

import appCss from "../styles.css?url";
import "../i18n";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { redirectOAuthHashToCallback } from "../lib/oauth-redirect";
import { Toaster } from "@/components/ui/sonner";

function NotFoundComponent() {
  const { t } = useTranslation();
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="font-display text-7xl font-bold text-primary">{t("notFound.title")}</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">{t("notFound.heading")}</h2>
        <p className="mt-2 text-sm text-muted-foreground">{t("notFound.description")}</p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            {t("notFound.goHome")}
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  const { t } = useTranslation();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">{t("error.title")}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{t("error.description")}</p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            {t("error.tryAgain")}
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-full border border-input bg-background px-5 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            {t("error.goHome")}
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "TrustSaathi — Temple, Trust & NGO Finance Software" },
      {
        name: "description",
        content:
          "TrustSaathi is an AI-powered finance and compliance platform for Indian temples, trusts and NGOs. Manage donations, accounts, audits and reports — all in one place.",
      },
      { name: "author", content: "TrustSaathi" },
      {
        name: "keywords",
        content:
          "Temple Management Software India, Trust Accounting Software, NGO Donation Management Software, Temple Finance Management System, AI Accounting for Trusts",
      },
      { property: "og:title", content: "TrustSaathi — Temple, Trust & NGO Finance Software" },
      {
        property: "og:description",
        content:
          "AI-powered accounting and donation management for temples, trusts and NGOs across India.",
      },
      { property: "og:type", content: "website" },
      { property: "og:site_name", content: "TrustSaathi" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:site", content: "@TrustSaathi" },
      { name: "twitter:image", content: "/trustsaathi-logo.png" },
      { property: "og:image", content: "/trustsaathi-logo.png" },
      { name: "theme-color", content: "#B7791F" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.ico", sizes: "any" },
      { rel: "icon", type: "image/png", href: "/favicon.png" },
      { rel: "apple-touch-icon", href: "/apple-touch-icon.png" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap",
      },
      { rel: "alternate", hrefLang: "en", href: "/?lang=en" },
      { rel: "alternate", hrefLang: "hi", href: "/?lang=hi" },
      { rel: "alternate", hrefLang: "gu", href: "/?lang=gu" },
      { rel: "alternate", hrefLang: "mr", href: "/?lang=mr" },
      { rel: "alternate", hrefLang: "x-default", href: "/" },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          name: "TrustSaathi",
          applicationCategory: "FinanceApplication",
          operatingSystem: "Web",
          description:
            "AI-powered finance and compliance operating system for Indian temples, trusts and NGOs.",
          offers: { "@type": "Offer", price: "0", priceCurrency: "INR" },
        }),
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  const { i18n } = useTranslation();

  useEffect(() => {
    const saved = localStorage.getItem("trustsaathi-lang");
    if (saved) {
      document.documentElement.lang = saved;
    }
    return () => {};
  }, []);

  useEffect(() => {
    document.documentElement.lang = i18n.language?.slice(0, 2) ?? "en";
  }, [i18n.language]);

  return (
    <html lang={i18n.language?.slice(0, 2) ?? "en"}>
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  useEffect(() => {
    redirectOAuthHashToCallback();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <Outlet />
      <Toaster />
    </QueryClientProvider>
  );
}
