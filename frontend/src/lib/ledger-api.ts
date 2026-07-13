import { apiJson } from "./api-client";

export type TxType = "Income" | "Expense";
export type PaymentMode = "UPI" | "Cash" | "Bank Transfer" | "Cheque";

export type LedgerTransaction = {
  id: string;
  date: string;
  name: string;
  category: string;
  type: TxType;
  mode: PaymentMode;
  amount: number;
  description?: string;
};

export type LedgerListResponse = {
  message: string;
  transactions: LedgerTransaction[];
};

export type CreateLedgerPayload = Omit<LedgerTransaction, "id">;

export type CreateLedgerResponse = {
  message: string;
  transaction: LedgerTransaction;
};

export function fetchLedger() {
  return apiJson<LedgerListResponse>("/api/ledger");
}

export function createLedgerTransaction(payload: CreateLedgerPayload) {
  return apiJson<CreateLedgerResponse>("/api/ledger", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
