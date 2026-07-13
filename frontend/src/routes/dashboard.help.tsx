import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { HelpCircle, Mail, Phone, MessageSquare } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/page-shell";

export const Route = createFileRoute("/dashboard/help")({
  head: () => ({
    meta: [{ title: "Help & Support — TrustSaathi" }, { name: "robots", content: "noindex" }],
  }),
  component: HelpPage,
});

function HelpPage() {
  const { t } = useTranslation();

  const cards = [
    { icon: Phone, title: t("help.callUs"), detail: "+91 99999 99999", note: t("help.callTime") },
    {
      icon: MessageSquare,
      title: t("help.whatsApp"),
      detail: t("help.chatWithUs"),
      note: t("help.whatsAppNote"),
    },
    {
      icon: Mail,
      title: t("help.email"),
      detail: "help@trustsaathi.in",
      note: t("help.emailNote"),
    },
  ];

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHeader title={t("help.pageTitle")} subtitle={t("help.pageSubtitle")} icon={HelpCircle} />
      <div className="grid gap-4 sm:grid-cols-3">
        {cards.map((c) => (
          <Card key={c.title} className="rounded-2xl border-border shadow-soft">
            <CardContent className="p-6">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-accent text-primary">
                <c.icon className="h-5 w-5" />
              </span>
              <p className="mt-4 font-display text-lg font-semibold">{c.title}</p>
              <p className="mt-1 text-base font-medium text-primary">{c.detail}</p>
              <p className="mt-1 text-sm text-muted-foreground">{c.note}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
