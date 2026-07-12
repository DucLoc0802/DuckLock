export interface GetReportQueryDto {
  day?: string;
  month?: string;
  year?: string; // Định dạng YYYY-MM, ví dụ: "2026-07". Nếu không truyền, mặc định là tháng hiện tại.
}
