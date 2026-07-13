import { apiJson } from "./api-client";

export type ComplianceAlertTone = "danger" | "warning" | "success";

export type ComplianceFilterKey =
  "missing_phone" | "missing_pan" | "pending_review" | `draft_missing_${string}`;

export type ComplianceAlert = {
  id: string;
  tone: ComplianceAlertTone;
  title: string;
  description: string;
  action: string;
  filter_key: ComplianceFilterKey | null;
};

export type ComplianceSummary = {
  message: string;
  score: number;
  updated_at: string;
  actionable_issues: number;
  alerts: ComplianceAlert[];
  counts: {
    total_donors: number;
    complete_donors: number;
    incomplete_donors: number;
    missing_phone: number;
    missing_pan: number;
    pending_reviews: number;
    draft_missing_fields: Record<string, number>;
  };
};

export function fetchComplianceSummary() {
  return apiJson<ComplianceSummary>("/api/compliance/summary");
}
