import { CreateRecurringTransactionDto } from "./create-recurring-transaction.dto";

export interface UpdateRecurringTransactionDto extends Partial<CreateRecurringTransactionDto> {
  isActive?: boolean;
}
