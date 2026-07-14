export interface CreateBudgetDto {
  amount: number;
  categoryId?: string | null; // NULL đại diện cho ngân sách tổng, có giá trị đại diện cho ngân sách của danh mục
  name?: string | null;
  amountInDefaultCurrency?: number;
  budgetMonth: string; // Định dạng "YYYY-MM-DD" (ngày đầu tiên của tháng, vd: "2026-07-01")
  alertThresholdPercent?: number; // Mặc định là 80 (%)
  isActive?: boolean;
}
