import { apiFetch, apiJson, ApiError } from "./api-client";
import { getAuthUser } from "./auth-session";
import type {
  ActionRequiredResponse,
  ExtractResponse,
  ReviewDonationRow,
  UploadPayload,
  UploadResponse,
} from "./ai-upload-types";
import { CRITICAL_FIELDS, LOW_CONFIDENCE_THRESHOLD } from "./ai-upload-types";

export function getOrganizationId(): string {
  const user = getAuthUser();
  const orgId = user?.organization_id;
  if (!orgId) {
    throw new ApiError(400, "No organization linked. Complete your profile and log in again.");
  }
  return String(orgId);
}

export function rowNeedsAttention(
  row: ReviewDonationRow,
  documentMissing: string[],
): Partial<Record<(typeof CRITICAL_FIELDS)[number], boolean>> {
  const flags: Partial<Record<(typeof CRITICAL_FIELDS)[number], boolean>> = {};
  const rowMissing = row._missing_fields ?? [];

  for (const field of CRITICAL_FIELDS) {
    if (rowMissing.includes(field) || documentMissing.includes(field)) {
      flags[field] = true;
    }
  }

  if (fieldEmpty(row, "donor_name")) flags.donor_name = true;
  if (fieldEmpty(row, "amount")) flags.amount = true;
  if (fieldEmpty(row, "date")) flags.date = true;
  if (fieldEmpty(row, "payment_mode")) flags.payment_mode = true;

  if (row._low_confidence || (row.confidence_score ?? 1) < LOW_CONFIDENCE_THRESHOLD) {
    flags.donor_name = true;
    flags.amount = true;
  }

  return flags;
}

function fieldEmpty(row: ReviewDonationRow, field: (typeof CRITICAL_FIELDS)[number]): boolean {
  const v = row[field];
  if (field === "amount") return v == null || Number(v) <= 0;
  return v == null || String(v).trim() === "";
}

export function validateRowsForSubmit(rows: ReviewDonationRow[]): string | null {
  for (let i = 0; i < rows.length; i += 1) {
    for (const field of CRITICAL_FIELDS) {
      if (fieldEmpty(rows[i], field)) {
        return `Row ${i + 1}: ${field.replace("_", " ")} is required before submitting.`;
      }
    }
  }
  return null;
}

function computeMissingFields(row: ReviewDonationRow): string[] {
  const missing: string[] = [];
  for (const field of CRITICAL_FIELDS) {
    if (fieldEmpty(row, field)) missing.push(field);
  }
  return missing;
}

export function toUploadRows(rows: ReviewDonationRow[]) {
  return rows.map((row) => {
    const missing = computeMissingFields(row);
    return {
      donor_name: row.donor_name?.trim() || null,
      amount: row.amount == null || Number(row.amount) <= 0 ? null : Number(row.amount),
      date: row.date || null,
      payment_mode: row.payment_mode?.trim() || null,
      confidence_score: row.confidence_score,
      missing_fields: missing,
    };
  });
}

/** Stage 1 — upload file to AI via backend proxy POST /api/extract */
export async function extractDocument(
  file: File,
  organizationId?: string,
): Promise<ExtractResponse> {
  const orgId = organizationId ?? getOrganizationId();
  const formData = new FormData();
  formData.append("file", file);
  formData.append("organization_id", orgId);

  const response = await apiFetch("/api/extract", {
    method: "POST",
    body: formData,
  });

  const raw = await response.text();
  let result: ExtractResponse & { error?: string };
  try {
    result = JSON.parse(raw) as ExtractResponse & { error?: string };
  } catch {
    throw new ApiError(
      response.status,
      raw.trimStart().startsWith("<")
        ? "Server returned HTML instead of JSON. Check VITE_API_URL points to your Render backend."
        : "Server returned an invalid JSON response.",
    );
  }

  if (!response.ok) {
    throw new ApiError(response.status, result.error ?? "Extraction failed.");
  }

  return result;
}

/** Stage 3 — persist reviewed data POST /api/ai/upload */
export async function uploadReviewedData(payload: UploadPayload): Promise<UploadResponse> {
  const result = await apiJson<UploadResponse | ActionRequiredResponse>("/api/ai/upload", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  if ("status" in result && result.status === "action_required") {
    throw new ApiError(400, result.message);
  }

  return result as UploadResponse;
}

export function buildUploadPayload(
  rows: ReviewDonationRow[],
  documentType: string,
  options: { draft: boolean },
): UploadPayload {
  return {
    organization_id: getOrganizationId(),
    document_type: documentType,
    record_status: options.draft ? "draft" : "completed",
    is_frontend_corrected: true,
    manual_review_required: options.draft,
    status: "success",
    data: toUploadRows(rows),
  };
}

export function mapExtractToReviewRows(extract: ExtractResponse): ReviewDonationRow[] {
  return extract.extracted_data.map((row, index) => ({
    ...row,
    id: `row-${index}-${Date.now()}`,
  }));
}
