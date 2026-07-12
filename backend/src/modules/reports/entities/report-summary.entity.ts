export interface CategoryBreakdown {
  categoryId: string;
  amount: number;
  percent: number;
}

export interface ReportSummaryEntity {
  monthLabel: string;      // Nhãn tháng hiển thị, e.g. "Tháng 7 năm 2026"
  totalExpense: number;    // Tổng chi tiêu trong tháng
  totalIncome: number;     // Tổng thu nhập trong tháng
  compareText: string;     // Chuỗi văn bản so sánh với tháng trước, e.g. "Chi tiêu tăng 12% so với tháng trước"
  dailySeries: number[];   // Mảng 7 phần tử ứng với chi tiêu từ Thứ 2 đến Chủ nhật của tuần hiện tại
  categoryBreakdown: CategoryBreakdown[]; // Chi tiết phân bổ chi tiêu theo danh mục
}
