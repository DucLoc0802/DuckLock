export type TransactionType = "expense" | "income";

export interface TransactionEntity {
  id: string;
  user_id: string;
  category_id: string | null;
  proof_image_id: string | null;
  amount: number;
  currency: string;
  amount_in_default_currency: number;
  type: TransactionType;
  transaction_date: Date;
  description: string | null;
  created_at?: Date;
  updated_at?: Date;
  deleted_at?: Date | null;
}
