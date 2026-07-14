import { createFileRoute } from "@tanstack/react-router";
import { Bell } from "lucide-react";
import { useTranslation } from "react-i18next";
import { PageHeader, ComingSoon } from "@/components/page-shell";

export const Route = createFileRoute("/dashboard/notifications")({
  head: () => ({
    meta: [{ title: "Notifications — TrustSaathi" }, { name: "robots", content: "noindex" }],
  }),
  component: () => {
    const { t } = useTranslation();
    return (
      <div className="mx-auto max-w-5xl space-y-6">
        <PageHeader title={t("notifications.pageTitle")} subtitle={t("notifications.pageSubtitle")} icon={Bell} />
        <ComingSoon title={t("notifications.comingSoon")} />
      </div>
    );
  },
});
