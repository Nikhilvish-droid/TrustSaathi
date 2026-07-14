import { createFileRoute } from "@tanstack/react-router";
import { Boxes } from "lucide-react";
import { useTranslation } from "react-i18next";
import { PageHeader, ComingSoon } from "@/components/page-shell";

export const Route = createFileRoute("/dashboard/assets")({
  head: () => ({
    meta: [{ title: "Assets & Inventory — TrustSaathi" }, { name: "robots", content: "noindex" }],
  }),
  component: () => {
    const { t } = useTranslation();
    return (
      <div className="mx-auto max-w-7xl space-y-6">
        <PageHeader
          title={t("assets.pageTitle")}
          subtitle={t("assets.pageSubtitle")}
          icon={Boxes}
        />
        <ComingSoon title={t("assets.comingSoon")} />
      </div>
    );
  },
});
