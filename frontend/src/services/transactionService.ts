import { API_BASE_URL } from '@/src/config/api';
import { mockTransactions } from '@/src/mocks/piggy-data';
import { CreateTransactionInput, Transaction } from '@/src/types/piggy';
import { randomDelay } from '@/src/utils/format';

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const transactionService = {
  // 1. API Lấy danh sách giao dịch từ MySQL Backend (UC-10)
  async listTransactions(token?: string | null): Promise<Transaction[]> {
    await wait(randomDelay());

    // Nếu người dùng chưa đăng nhập, chưa gọi API
    if (!token) {
      return [];
    }

    try {
      // Gọi HTTP GET request kèm Header Authorization
      const response = await fetch(`${API_BASE_URL}/transactions`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`, // Header xác thực JWT
        },
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Lấy danh sách giao dịch thất bại');
      }

      // Ánh xạ kiểu dữ liệu từ MySQL Database sang định dạng React Native Client
      return result.data.map((item: any) => ({
        id: item.id,
        amount: Number(item.amount),
        // Nếu database chưa có category_id thì tạm dùng 'food' làm mặc định
        categoryId: item.category_id || 'food', 
        type: item.type.toLowerCase(), // MySQL lưu 'EXPENSE'/'INCOME' -> App dùng 'expense'/'income'
        note: item.description || '',
        transactionDate: item.transaction_date,
        createdAt: item.created_at,
        syncState: 'synced',
      }));
    } catch (error) {
      console.error("Lỗi khi kết nối lấy danh sách giao dịch:", error);
      // Fallback về mock data nếu xảy ra lỗi kết nối
      return mockTransactions;
    }
  },

  // 2. API Lưu giao dịch mới vào MySQL Backend (UC-04)
  async createTransaction(
    input: CreateTransactionInput,
    token: string | null,
    isOffline: boolean,
    categoryName: string, // Nhận thêm tên danh mục tiếng Việt từ Store truyền xuống
  ): Promise<Transaction> {
    await wait(randomDelay());

    // Nếu ứng dụng đang chạy ở chế độ Ngoại tuyến (Offline), lưu local ngay
    if (isOffline) {
      return {
        id: `local-txn-${Date.now()}`,
        amount: input.amount,
        categoryId: input.categoryId,
        type: input.type,
        note: input.note,
        transactionDate: input.transactionDate,
        createdAt: new Date().toISOString(),
        syncState: 'pending_create',
      };
    }

    // Gọi API POST /api/transactions để lưu giao dịch vào MySQL
    const response = await fetch(`${API_BASE_URL}/transactions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`, // Header xác thực JWT
      },
      body: JSON.stringify({
        amount: input.amount,
        category: categoryName, // Gửi tên danh mục để Backend tự Map hoặc tạo mới
        transactionDate: input.transactionDate.slice(0, 10), // Cắt lấy chuỗi ngày dạng YYYY-MM-DD
        description: input.note,
        type: input.type,
      }),
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.message || 'Lưu giao dịch thất bại');
    }

    // Trả về đối tượng giao dịch đã được tạo thành công trên DB
    return {
      id: result.data.id,
      amount: Number(result.data.amount),
      categoryId: input.categoryId, // Giữ nguyên categoryId hiện tại trên App
      type: result.data.type.toLowerCase(),
      note: result.data.description || '',
      transactionDate: result.data.transactionDate,
      createdAt: new Date().toISOString(),
      syncState: 'synced',
    };
  },
};
