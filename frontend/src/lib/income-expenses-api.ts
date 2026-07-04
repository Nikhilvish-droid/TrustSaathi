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
    note: row.note ?? "",
    amount: Number(row.amount),
  };
}
