import { apiFetch, apiJson } from "./api-client";

export type DonorCategory = "Repeat" | "New" | "Corporate" | "Trust";

export type DonorFilter = "all" | "repeat" | "new" | "corporate" | "trust";

export type ComplianceFilter =
  | "missing_phone"
  | "missing_pan"
  | "pending_review"
  | `draft_missing_${string}`;

export type DonorRecord = {
  id: string;
  name: string;
  phone: string | null;
  pan: string | null;
  donation_count: number;
  lifetime_amount: number;
  last_donation_date: string | null;
  first_donation_date: string | null;
  last_donation_id: string | null;
  last_donation_amount: number | null;
  last_donation_payment_mode: string | null;
  category: DonorCategory;
};

export type DonorStats = {
  total_donors: number;
  repeat_donors: number;
  new_this_month: number;
  lifetime_value: number;
};

export type DonorsResponse = {
  message: string;
  stats: DonorStats;
  donors: DonorRecord[];
};

export function fetchDonors(
  search = "",
  filter: DonorFilter = "all",
  complianceFilter?: ComplianceFilter | null,
) {
  const params = new URLSearchParams();
  if (search.trim()) params.set("search", search.trim());
  if (filter !== "all") params.set("filter", filter);
  if (complianceFilter) params.set("compliance_filter", complianceFilter);
  const qs = params.toString();
  return apiJson<DonorsResponse>(`/api/donors${qs ? `?${qs}` : ""}`);
}

export type UpdateDonorPayload = {
  name: string;
  phone?: string | null;
  pan?: string | null;
};

export type UpdateDonorResponse = {
  message: string;
  donor: Pick<DonorRecord, "id" | "name" | "phone" | "pan">;
};

export type DonorDonation = {
  id: string;
  amount: number;
  date: string;
  payment_mode: string;
};

export type DonorDonationsResponse = {
  message: string;
  donations: DonorDonation[];
};

export function fetchDonorDonations(donorId: string) {
  return apiJson<DonorDonationsResponse>(`/api/donors/${donorId}/donations`);
}

export async function updateDonor(id: string, payload: UpdateDonorPayload) {
  return apiJson<UpdateDonorResponse>(`/api/donors/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export type DeleteDonorResponse = {
  message: string;
  deleted_id: string;
};

export async function deleteDonor(id: string) {
  const response = await apiFetch(`/api/donors/${id}`, { method: "DELETE" });
  const result = (await response.json()) as DeleteDonorResponse & { error?: string };
  if (!response.ok) {
    throw new Error(result.error ?? "Failed to delete donor.");
  }
  return result;
}

export function formatCompactInr(amount: number): string {
  if (amount >= 10_000_000) {
    return `₹${(amount / 10_000_000).toFixed(1).replace(/\.0$/, "")}Cr`;
  }
  if (amount >= 100_000) {
    return `₹${(amount / 100_000).toFixed(1).replace(/\.0$/, "")}L`;
  }
  if (amount >= 1_000) {
    return `₹${(amount / 1_000).toFixed(1).replace(/\.0$/, "")}K`;
  }
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function donorInitial(name: string): string {
  const skip = new Set(["shri", "smt", "mr", "mrs", "ms", "dr", "श्री", "श्रीमती"]);
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const meaningful = parts.find((p) => !skip.has(p.toLocaleLowerCase("en-US")));
  const target = meaningful ?? parts[0] ?? "?";
  return [...target][0] ?? "?";
}
