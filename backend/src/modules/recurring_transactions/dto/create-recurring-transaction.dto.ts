import { RecurringFrequency, TransactionType } from "../entities/recurring-transaction.entity";

export interface CreateRecurringTransactionDto {
  walletId: string;
  categoryId?: string | null;
  name: string;
  amount: number;
  type: TransactionType;
  description?: string | null;
  frequency: RecurringFrequency;
  dayOfPeriod: number; // Ngày lặp lại trong chu kỳ (vd: ngày 5 hàng tháng, thứ 2 hàng tuần)
  startDate: string; // Định dạng "YYYY-MM-DD"
  endDate?: string | null; // Định dạng "YYYY-MM-DD" (nếu có)
  nextExecutionDate: string; // Định dạng "YYYY-MM-DD"
}
