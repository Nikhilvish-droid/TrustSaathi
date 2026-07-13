import { createFileRoute } from "@tanstack/react-router";
import { Bell } from "lucide-react";
import { PageHeader, ComingSoon } from "@/components/page-shell";

export const Route = createFileRoute("/dashboard/notifications")({
  head: () => ({
    meta: [{ title: "Notifications — TrustSaathi" }, { name: "robots", content: "noindex" }],
  }),
  component: () => (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHeader title="Notifications" subtitle="All important alerts in one place." icon={Bell} />
      <ComingSoon title="Notification inbox coming up" />
    </div>
  ),
});
