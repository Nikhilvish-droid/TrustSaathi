import { createFileRoute } from "@tanstack/react-router";
import { HelpCircle, Mail, Phone, MessageSquare } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/page-shell";

export const Route = createFileRoute("/dashboard/help")({
  head: () => ({ meta: [{ title: "Help & Support — TrustSaathi" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHeader title="Help & Support" subtitle="We're here for your temple, every step of the way." icon={HelpCircle} />
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { icon: Phone, title: "Call us", detail: "+91 99999 99999", note: "Mon–Sat, 9 AM – 7 PM" },
          { icon: MessageSquare, title: "WhatsApp", detail: "Chat with us", note: "Reply within 30 minutes" },
          { icon: Mail, title: "Email", detail: "help@trustsaathi.in", note: "Reply within 1 working day" },
        ].map((c) => (
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
  ),
});
