import { createFileRoute } from "@tanstack/react-router";
import { Boxes } from "lucide-react";
import { PageHeader, ComingSoon } from "@/components/page-shell";

export const Route = createFileRoute("/dashboard/assets")({
  head: () => ({ meta: [{ title: "Assets & Inventory — TrustSaathi" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader title="Assets & Inventory" subtitle="Track land, buildings, gold, vehicles, furniture and temple inventory." icon={Boxes} />
      <ComingSoon title="Asset register coming up" />
    </div>
  ),
});
