import { apiJson } from "./api-client";

export type IncomeExpenseType = "Income" | "Expense";

export type IncomeExpenseRecord = {
  id: string;
  organization_id: string;
  created_by: string | null;
  type: IncomeExpenseType;
  category: string;
  note: string | null;
  amount: number | string;
  date: string;
  created_at: string;
  updated_at: string;
};

export type IncomeExpensesListResponse = {
  message: string;
  transactions: IncomeExpenseRecord[];
};

export type CreateIncomeExpensePayload = {
  type: IncomeExpenseType;
  category: string;
  note?: string;
  amount: number;
  date: string;
};

export type CreateIncomeExpenseResponse = {
  message: string;
  transaction: IncomeExpenseRecord;
};

export type UpdateIncomeExpensePayload = CreateIncomeExpensePayload;

export type UpdateIncomeExpenseResponse = CreateIncomeExpenseResponse;

export type DeleteIncomeExpenseResponse = {
  message: string;
  deleted_id: string;
};

export function fetchIncomeExpenses() {
  return apiJson<IncomeExpensesListResponse>("/api/income-expenses");
}

export function createIncomeExpense(payload: CreateIncomeExpensePayload) {
  return apiJson<CreateIncomeExpenseResponse>("/api/income-expenses", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateIncomeExpense(id: string, payload: UpdateIncomeExpensePayload) {
  return apiJson<UpdateIncomeExpenseResponse>(`/api/income-expenses/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function deleteIncomeExpense(id: string) {
  return apiJson<DeleteIncomeExpenseResponse>(`/api/income-expenses/${id}`, {
    method: "DELETE",
  });
}

const LEDGER_NOTE_META_PREFIX = "TS_LEDGER_META::";

function formatDecodedLedgerNote(value: unknown): string {
  if (!value || typeof value !== "object") return "";

  const payload = value as {
    name?: unknown;
    mode?: unknown;
    description?: unknown;
  };

  const name = typeof payload.name === "string" ? payload.name.trim() : "";
  const mode = typeof payload.mode === "string" ? payload.mode.trim() : "";
  const description =
    typeof payload.description === "string" ? payload.description.trim() : "";

  const summary = [name, mode].filter(Boolean).join(" - ");

  if (summary && description) return `${summary}: ${description}`;
  if (description) return description;
  if (summary) return summary;
  return "";
}

function normalizeNote(note: string | null): string {
  const raw = (note ?? "").trim();
  if (!raw) return "";

  const encoded = raw.startsWith(LEDGER_NOTE_META_PREFIX)
    ? raw.slice(LEDGER_NOTE_META_PREFIX.length)
    : raw;

  // Handles both prefixed metadata notes and plain JSON note payloads.
  if (encoded.startsWith("{") && encoded.endsWith("}")) {
    try {
      const parsed = JSON.parse(encoded);
      const formatted = formatDecodedLedgerNote(parsed);
      if (formatted) return formatted;
    } catch {
      // Fall back to the original note when JSON parsing fails.
    }
  }

  return raw;
}

function toDateOnly(value: string): string {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value.split("T")[0] ?? value;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function mapIncomeExpenseRecord(row: IncomeExpenseRecord) {
  return {
    id: row.id,
    date: toDateOnly(row.date),
    category: row.category,
    type: row.type,
    note: normalizeNote(row.note),
    amount: Number(row.amount),
  };
}
