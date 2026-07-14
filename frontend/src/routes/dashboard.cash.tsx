import { createFileRoute } from "@tanstack/react-router";
import { Truck } from "lucide-react";
import { useTranslation } from "react-i18next";
import { PageHeader, ComingSoon } from "@/components/page-shell";

export const Route = createFileRoute("/dashboard/cash")({
  head: () => ({
    meta: [
      { title: "Cash & Vehicle Tracking — TrustSaathi" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => {
    const { t } = useTranslation();
    return (
      <div className="mx-auto max-w-7xl space-y-6">
        <PageHeader
          title={t("cash.pageTitle")}
          subtitle={t("cash.pageSubtitle")}
          icon={Truck}
        />
        <ComingSoon title={t("cash.comingSoon")} />
      </div>
    );
  },
});
