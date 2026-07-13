import { createFileRoute } from "@tanstack/react-router";
import { Truck } from "lucide-react";
import { PageHeader, ComingSoon } from "@/components/page-shell";

export const Route = createFileRoute("/dashboard/cash")({
  head: () => ({
    meta: [
      { title: "Cash & Vehicle Tracking — TrustSaathi" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader
        title="Cash & Vehicle Tracking"
        subtitle="Cash movement, collection routes, vehicle logs and fuel expenses."
        icon={Truck}
      />
      <ComingSoon title="Cash & vehicle module coming up" />
    </div>
  ),
});
