import { Budget, BudgetInput } from '@/src/types/piggy';
import { localBudgetService } from '../db/localBudgetService';
import { syncService } from './syncService';

export const budgetService = {
  async listBudgets(token: string | null): Promise<Budget[]> {
    // 1. Luôn đọc từ SQLite local trước để UI hiển thị nhanh nhất và chạy offline
    const localData = await localBudgetService.listBudgets();
    
    // 2. Kích hoạt đồng bộ ngầm lên server MySQL
    if (token) {
      syncService.syncAll(token).catch(err => console.log('Đồng bộ ngầm ngân sách thất bại:', err));
    }
    
    return localData;
  },

  async createBudget(input: BudgetInput, token: string | null): Promise<Budget> {
    // 1. Tạo trực tiếp vào SQLite local
    const created = await localBudgetService.createBudget(input);
    
    // 2. Kích hoạt đồng bộ ngầm lên server MySQL
    if (token) {
      syncService.syncAll(token).catch(err => console.log('Đồng bộ ngầm ngân sách thất bại:', err));
    }
    
    return created;
  },

  async updateBudget(id: string, input: BudgetInput, token: string | null): Promise<Budget> {
    // 1. Cập nhật trực tiếp vào SQLite local
    const updated = await localBudgetService.updateBudget(id, input);
    
    // 2. Kích hoạt đồng bộ ngầm lên server MySQL
    if (token) {
      syncService.syncAll(token).catch(err => console.log('Đồng bộ ngầm ngân sách thất bại:', err));
    }
    
    return updated;
  },

  async deleteBudget(id: string, token: string | null): Promise<void> {
    // 1. Xóa trực tiếp trong SQLite local
    await localBudgetService.deleteBudget(id);
    
    // 2. Kích hoạt đồng bộ ngầm lên server MySQL
    if (token) {
      syncService.syncAll(token).catch(err => console.log('Đồng bộ ngầm ngân sách thất bại:', err));
    }
  },
};
