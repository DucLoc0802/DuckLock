import { API_BASE_URL } from '@/src/config/api';
import { Wallet, WalletType } from '@/src/types/piggy';

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
      console.log('Thông báo: Lấy ví từ Mock do chưa kết nối API hoặc API chưa sẵn sàng.');
      return [
        { id: 'mock-cash', name: 'Tiền mặt', type: 'CASH', balance: 1250000, currency: 'VND', interest_rate_percent: null },
        { id: 'mock-bank', name: 'Vietcombank', type: 'BANK', balance: 15400000, currency: 'VND', interest_rate_percent: null },
        { id: 'mock-saving', name: 'Sổ tiết kiệm heo đất', type: 'SAVING', balance: 50000000, currency: 'VND', interest_rate_percent: 6.2 },
      ];
    }
  },

  async createWallet(
    wallet: { name: string; type: WalletType; balance: number; interestRatePercent: number | null },
    token: string | null
  ): Promise<Wallet> {
    const newWallet: Wallet = {
      id: `wallet-${Date.now()}`,
      name: wallet.name,
      type: wallet.type,
      balance: wallet.balance,
      currency: 'VND',
      interest_rate_percent: wallet.interestRatePercent,
    };

    if (!token) return newWallet;

    try {
      const response = await fetch(`${API_BASE_URL}/wallets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: wallet.name,
          type: wallet.type,
          balance: wallet.balance,
          interestRatePercent: wallet.interestRatePercent,
        }),
      });

      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Tạo ví thất bại');
      }

      return {
        id: result.data.id,
        name: result.data.name,
        type: result.data.type,
        balance: Number(result.data.balance),
        currency: result.data.currency || 'VND',
        interest_rate_percent: result.data.interest_rate_percent
          ? Number(result.data.interest_rate_percent)
          : null,
      };
    } catch (error) {
      console.log('Thông báo: Tự động lưu ví cục bộ (Chế độ giả lập).');
      return newWallet;
    }
  },

  async updateWallet(
    id: string,
    wallet: { name?: string; balance?: number; interestRatePercent?: number | null },
    token: string | null
  ): Promise<Wallet> {
    const updatedWallet: Wallet = {
      id,
      name: wallet.name || 'Ví',
      type: 'BANK',
      balance: wallet.balance ?? 0,
      currency: 'VND',
      interest_rate_percent: wallet.interestRatePercent ?? null,
    };

    if (!token) return updatedWallet;

    try {
      const response = await fetch(`${API_BASE_URL}/wallets/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: wallet.name,
          balance: wallet.balance,
          interestRatePercent: wallet.interestRatePercent,
        }),
      });

      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Cập nhật ví thất bại');
      }

      return {
        id: result.data.id,
        name: result.data.name,
        type: result.data.type,
        balance: Number(result.data.balance),
        currency: result.data.currency || 'VND',
        interest_rate_percent: result.data.interest_rate_percent
          ? Number(result.data.interest_rate_percent)
          : null,
      };
    } catch (error) {
      console.log('Thông báo: Tự động cập nhật ví cục bộ (Chế độ giả lập).');
      return updatedWallet;
    }
  },
};
