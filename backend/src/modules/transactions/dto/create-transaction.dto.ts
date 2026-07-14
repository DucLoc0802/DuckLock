export type TransactionType = "expense" | "income";

export interface CreateTransactionDto {
  amount: number;
  category: string;
  transactionDate: Date;
  description?: string;
  type: TransactionType;
  walletId: string;
  proofImage?: Buffer;
  expenseCategoryId?: string;
  incomeCategoryId?: string;
}
