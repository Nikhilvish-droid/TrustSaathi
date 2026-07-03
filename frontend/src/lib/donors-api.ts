import { apiJson } from "./api-client";

export type DonorCategory = "Repeat" | "New" | "Corporate" | "Trust";

export type DonorFilter = "all" | "repeat" | "new" | "corporate" | "trust";

export type DonorRecord = {
  id: string;
  name: string;
  phone: string | null;
  pan: string | null;
  donation_count: number;
  lifetime_amount: number;
  last_donation_date: string | null;
  first_donation_date: string | null;
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

export function fetchDonors(search = "", filter: DonorFilter = "all") {
  const params = new URLSearchParams();
  if (search.trim()) params.set("search", search.trim());
  if (filter !== "all") params.set("filter", filter);
  const qs = params.toString();
  return apiJson<DonorsResponse>(`/api/donors${qs ? `?${qs}` : ""}`);
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
  const skip = new Set(["shri", "smt", "mr", "mrs", "ms", "dr"]);
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const meaningful = parts.find((p) => !skip.has(p.toLowerCase()));
  return (meaningful ?? parts[0] ?? "?")[0].toUpperCase();
}
