import { apiJson } from "./api-client";

export type DashboardPeriod = "today" | "month" | "fy" | "lifetime";

export type PaymentModeBreakdown = {
  mode: string;
  count: number;
  amount: number;
  percent: number;
};

export type ChartOverviewPoint = {
  label: string;
  donation_amount: number;
  donation_count: number;
  donors: number;
  avg_donation: number;
  donations_k: number;
  avg_donation_k: number;
  is_highlight: boolean;
};

export type DonationSummaryData = {
  period: string;
  period_label: string;
  chart_subtitle: string;
  chart_badge: string | null;
  total_funds: number;
  lifetime_funds: number;
  total_donors: number;
  registered_donors: number;
  total_donations: number;
  avg_donation: number;
  max_donation: number;
  min_donation: number;
  pending_reviews: number;
  payment_modes: PaymentModeBreakdown[];
  chart_overview: ChartOverviewPoint[];
  changes: {
    total_funds: number;
    total_donations: number;
    total_donors: number;
    avg_donation: number;
    max_donation: number;
    min_donation: number;
  };
};

export type DonationSummary = {
  message: string;
  data: DonationSummaryData;
};

export type DonationsListResponse = {
  message: string;
  total_records: number;
  current_page: number;
  total_pages: number;
  donations: Array<{
    id: number;
    organization_id: number;
    donor_id: number;
    amount: number;
    date: string;
    payment_mode: string;
    confidence_score?: number;
    requires_review?: boolean;
  }>;
};

export function fetchDonationSummary(period: DashboardPeriod = "month") {
  const params = new URLSearchParams({ period });
  return apiJson<DonationSummary>(`/api/donations/summary?${params.toString()}`);
}

export function fetchDonations(page = 1, limit = 50) {
  return apiJson<DonationsListResponse>(`/api/donations/all?page=${page}&limit=${limit}`);
}

export type TopDonor = {
  name: string;
  donation_count: number;
  total_amount: number;
};

export type RecentDonation = {
  id: string;
  donor_name: string;
  amount: number;
  date: string;
  payment_mode: string;
};

export function fetchTopDonors(limit = 5) {
  return apiJson<{ message: string; donors: TopDonor[] }>(`/api/donations/top-donors?limit=${limit}`);
}

export function fetchRecentDonations(limit = 5) {
  return apiJson<{ message: string; donations: RecentDonation[] }>(
    `/api/donations/recent?limit=${limit}`,
  );
}

export function formatDonationDate(dateStr: string): string {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(d);
}

export function formatInr(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatPercentChange(value: number): { text: string; up: boolean } {
  if (value === 0) return { text: "0%", up: true };
  const up = value > 0;
  return { text: `${up ? "+" : ""}${value}%`, up };
}
