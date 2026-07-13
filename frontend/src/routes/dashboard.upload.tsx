import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Upload } from "lucide-react";
import { PageHeader } from "@/components/page-shell";
import { DocumentUploadFlow } from "@/components/ai-upload/DocumentUploadFlow";

export const Route = createFileRoute("/dashboard/upload")({
  head: () => ({
    meta: [{ title: "AI Document Upload — TrustSaathi" }, { name: "robots", content: "noindex" }],
  }),
  component: UploadPage,
});

function UploadPage() {
  const { t } = useTranslation();

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader title={t("upload.pageTitle")} subtitle={t("upload.pageSubtitle")} icon={Upload} />
      <DocumentUploadFlow />
    </div>
  );
}
