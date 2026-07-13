import { createFileRoute } from "@tanstack/react-router";
import { BookOpen } from "lucide-react";
import { PageHeader, ComingSoon } from "@/components/page-shell";

export const Route = createFileRoute("/dashboard/ledger")({
  head: () => ({
    meta: [{ title: "Ledger & Accounting — TrustSaathi" }, { name: "robots", content: "noindex" }],
  }),
  component: () => (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader
        title="Ledger & Accounting"
        subtitle="Cash book, bank book, trial balance and more."
        icon={BookOpen}
      />
      <ComingSoon
        title="Accounting modules coming up"
        note="Cash Book, Bank Book, General Ledger, Journal Entries, Trial Balance, Balance Sheet and Income & Expenditure Statement — all in plain language."
      />
    </div>
  ),
});
