import { CreateBudgetDto } from "./create-budget.dto";

export interface UpdateBudgetDto extends Partial<CreateBudgetDto> {
  isActive?: boolean;
}
