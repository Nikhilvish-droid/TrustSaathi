import { createFileRoute } from "@tanstack/react-router";
import { Upload } from "lucide-react";
import { PageHeader } from "@/components/page-shell";
import { DocumentUploadFlow } from "@/components/ai-upload/DocumentUploadFlow";

export const Route = createFileRoute("/dashboard/upload")({
  head: () => ({ meta: [{ title: "AI Document Upload — TrustSaathi" }, { name: "robots", content: "noindex" }] }),
  component: UploadPage,
});

function UploadPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        title="AI Document Upload"
        subtitle="Upload registers and receipts — review AI-extracted entries before saving."
        icon={Upload}
      />
      <DocumentUploadFlow />
    </div>
  );
}
