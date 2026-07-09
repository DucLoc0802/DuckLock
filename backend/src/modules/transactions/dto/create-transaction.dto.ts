export type TransactionType = "expense" | "income";

export interface CreateTransactionDto {
  amount: number;
  category: string;
  transactionDate: Date;
  description?: string;
  type: TransactionType;
}
