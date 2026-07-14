export interface BudgetEntity {
  id: string;
  user_id: string;
  category_id: string | null;
  name: string | null;
  amount: number;
  currency: string;
  amount_in_default_currency: number;
  budget_month: string; // Định dạng ngày "YYYY-MM-DD" đại diện cho tháng ngân sách
  alert_threshold_percent: number;
  is_active: boolean;
  created_at?: Date;
  updated_at?: Date;
  deleted_at?: Date | null;
}
