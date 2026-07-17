import { API_BASE_URL } from '@/src/config/api';
import { Wallet, WalletInterest, WalletType } from '@/src/types/piggy';

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
        created_at: item.created_at || null,
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
        created_at: result.data.created_at || null,
      };
    } catch (error) {
      console.log('Thông báo: Tự động lưu ví cục bộ (Chế độ giả lập).');
      return newWallet;
    }
  },

  async updateWallet(
    id: string,
    wallet: { name?: string; balance?: number; interestRatePercent?: number | null; type?: WalletType },
    token: string | null
  ): Promise<Wallet> {
    const updatedWallet: Wallet = {
      id,
      name: wallet.name || 'Ví',
      type: wallet.type || 'BANK',
      balance: wallet.balance ?? 0,
      currency: 'VND',
      interest_rate_percent: wallet.interestRatePercent ?? null,
    };

    if (!token) return updatedWallet;

    const response = await fetch(`${API_BASE_URL}/wallets/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        name: wallet.name,
        balance: wallet.balance,
        type: wallet.type,
        interestRatePercent: wallet.interestRatePercent,
      }),
    });

    const result = await response.json();
    if (!response.ok || !result.success) {
      throw new Error(result.message || 'Cập nhật ví thất bại');
    }

    return {
      id: result.data.id ?? id,
      name: result.data.name ?? wallet.name ?? 'Ví',
      type: result.data.type ?? wallet.type ?? 'BANK',
      balance: Number(result.data.balance ?? wallet.balance ?? 0),
      currency: result.data.currency || 'VND',
      interest_rate_percent: result.data.interest_rate_percent != null
        ? Number(result.data.interest_rate_percent)
        : (wallet.interestRatePercent ?? null),
      created_at: result.data.created_at || null,
    };
  },

  async deleteWallet(id: string, token: string | null): Promise<void> {
    if (!token) throw new Error('Bạn cần đăng nhập để thực hiện');

    const response = await fetch(`${API_BASE_URL}/wallets/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });
    const result = await response.json();
    if (!response.ok || !result.success) {
      throw new Error(result.message || 'Xóa ví thất bại');
    }
  },

  async calculateInterest(token: string | null): Promise<WalletInterest[]> {
    if (!token) return [];

    const response = await fetch(`${API_BASE_URL}/wallets/calculate-interest`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });
    const result = await response.json();
    if (!response.ok || !result.success) {
      throw new Error(result.message || 'Tính lãi thất bại');
    }

    return (result.data || []).map((item: any) => ({
      walletId: item.walletId,
      walletName: item.walletName,
      balance: Number(item.balance) || 0,
      interestRatePercent: Number(item.interestRatePercent) || 0,
      dailyInterest: Number(item.dailyInterest) || 0,
      currency: item.currency || 'VND',
    }));
  },

  async collectInterest(walletId: string, period: 'MONTHLY' | 'YEARLY', token: string | null) {
    if (!token) throw new Error('Bạn cần đăng nhập để thực hiện');

    const response = await fetch(`${API_BASE_URL}/wallets/collect-interest`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ wallet_id: walletId, period }),
    });
    const result = await response.json();
    if (!response.ok || !result.success) {
      throw new Error(result.message || 'Nhận lãi thất bại');
    }
    return result.data;
  },
};
