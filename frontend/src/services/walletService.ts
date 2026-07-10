import { API_BASE_URL } from '@/src/config/api';
import { Wallet } from '@/src/types/piggy';

export const walletService = {
  async listWallets(token: string | null): Promise<Wallet[]> {
    if (!token) return [];

    try {
      const response = await fetch(`${API_BASE_URL}/wallets`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Lấy danh sách ví thất bại');
      }

      return result.data.map((item: any) => ({
        id: item.id,
        name: item.name,
        type: item.type,
        balance: Number(item.balance),
        currency: item.currency || 'VND',
        interest_rate_percent: item.interest_rate_percent
          ? Number(item.interest_rate_percent)
          : null,
      }));
    } catch (error) {
      console.log('Thông báo: Chưa có dữ liệu ví hoặc API chưa sẵn sàng.');
      return [];
    }
  },
};
