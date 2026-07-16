export type RecurringFrequency = "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY";
export type TransactionType = "EXPENSE" | "INCOME";

export interface RecurringTransactionEntity {
  id: string;
  user_id: string;
  wallet_id: string;
  category_id: string | null;
  name: string;
  amount: number;
  type: TransactionType;
  description: string | null;
  frequency: RecurringFrequency;
  day_of_period: number;
  start_date: string; // YYYY-MM-DD
  end_date: string | null; // YYYY-MM-DD
  last_executed_at: string | null; // YYYY-MM-DD
  next_execution_date: string; // YYYY-MM-DD
  is_active: boolean;
  created_at?: Date;
  updated_at?: Date;
  deleted_at?: Date | null;
}
