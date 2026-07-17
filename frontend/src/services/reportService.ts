import { API_BASE_URL } from '@/src/config/api';
import { ReportSummary } from '@/src/types/piggy';
import { formatCompactCurrency } from '@/src/utils/format';

function formatCompareText(raw: string): string {
  if (!raw) return 'Đang cập nhật';
  // Backend returns "Tăng 50000" or "Giảm 20000"
  const match = raw.match(/(Tăng|Giảm)\s+(\d+)/);
  if (match) {
    const direction = match[1];
    const amount = Number(match[2]);
    return `${direction} ${formatCompactCurrency(amount)} so với tháng trước`;
  }
  return raw;
}

export const reportService = {
  async getMonthlySummary(token: string | null): Promise<ReportSummary | null> {
    if (!token) return null;

    try {
      const response = await fetch(`${API_BASE_URL}/reports/month`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Lấy báo cáo thất bại');
      }

      return {
        monthLabel: result.data.monthLabel,
        totalExpense: Number(result.data.totalExpense) || 0,
        totalIncome: Number(result.data.totalIncome) || 0,
        compareText: formatCompareText(result.data.compareText),
        dailySeries: result.data.dailySeries || [],
        categoryBreakdown: (result.data.categoryBreakdown || []).map((item: any) => ({
          categoryId: item.categoryId,
          amount: Number(item.amount) || 0,
          percent: Number(item.percent) || 0,
        })),
      };
    } catch (error) {
      console.log('Thông báo: Lỗi khi lấy báo cáo từ backend (hoặc API chưa sẵn sàng).');
      return null;
    }
  },

  async getWeeklySummary(token: string | null): Promise<{ startOfWeek: string; endOfWeek: string; dailySeries: number[] } | null> {
    if (!token) return null;

    try {
      const response = await fetch(`${API_BASE_URL}/reports/week`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Lấy báo cáo tuần thất bại');
      }

      return {
        startOfWeek: result.data.startOfWeek,
        endOfWeek: result.data.endOfWeek,
        dailySeries: (result.data.dailySeries || []).map((v: any) => Number(v) || 0),
      };
    } catch (error) {
      console.log('Thông báo: Lỗi khi lấy báo cáo tuần từ backend.');
      return null;
    }
  },
};
