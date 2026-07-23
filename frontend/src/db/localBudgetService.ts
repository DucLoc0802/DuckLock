import { LocalDatabase } from './localDatabase';
import { Budget, BudgetInput } from '../types/piggy';

const generateId = () => {
  return 'bg_' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
};

export const localBudgetService = {
  // 1. Lấy danh sách ngân sách local
  listBudgets: async (): Promise<Budget[]> => {
    const db = await LocalDatabase.getDb();
    const rows = await db.getAllAsync<any>('SELECT * FROM budgets');
    return rows.map(row => ({
      id: row.id,
      name: row.name,
      categoryId: row.category_id,
      amount: Number(row.amount) || 0,
      currency: row.currency,
      budgetMonth: row.budget_month,
      amountInDefaultCurrency: Number(row.amount) || 0,
      alertThresholdPercent: Number(row.alert_threshold_percent) || 80,
      isActive: row.is_active === 1 || row.is_active === true || row.is_active === '1',
      createdAt: row.created_at
    }));
  },

  // 2. Lấy chi tiết ngân sách local
  getBudgetById: async (id: string): Promise<Budget | null> => {
    const db = await LocalDatabase.getDb();
    const row = await db.getFirstAsync<any>('SELECT * FROM budgets WHERE id = ?', [id]);
    if (!row) return null;
    return {
      id: row.id,
      name: row.name,
      categoryId: row.category_id,
      amount: Number(row.amount) || 0,
      currency: row.currency,
      budgetMonth: row.budget_month,
      amountInDefaultCurrency: Number(row.amount) || 0,
      alertThresholdPercent: Number(row.alert_threshold_percent) || 80,
      isActive: row.is_active === 1 || row.is_active === true || row.is_active === '1',
      createdAt: row.created_at
    };
  },

  // 3. Tạo ngân sách local
  createBudget: async (input: BudgetInput): Promise<Budget> => {
    const db = await LocalDatabase.getDb();
    const id = generateId();
    const now = new Date().toISOString();

    await db.runAsync(
      `INSERT INTO budgets (id, name, category_id, amount, currency, budget_month, alert_threshold_percent, is_active, created_at, updated_at, sync_status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending_create')`,
      [
        id,
        input.name,
        input.categoryId || null,
        input.amount,
        'VND',
        input.budgetMonth,
        input.alertThresholdPercent ?? 80,
        input.isActive !== false ? 1 : 0,
        now,
        now
      ]
    );

    // Đẩy vào hàng đợi sync_queue
    const payload = JSON.stringify({
      name: input.name,
      categoryId: input.categoryId || null,
      amount: input.amount,
      budgetMonth: input.budgetMonth,
      alertThresholdPercent: input.alertThresholdPercent ?? 80,
      isActive: input.isActive !== false
    });

    await db.runAsync(
      `INSERT INTO sync_queue (id, entity_type, entity_id, operation, payload, created_at)
       VALUES (?, 'budget', ?, 'CREATE', ?, ?)`,
      ['sq_' + generateId(), id, payload, now]
    );

    return {
      id,
      name: input.name,
      categoryId: input.categoryId || null,
      amount: input.amount,
      currency: 'VND',
      budgetMonth: input.budgetMonth,
      amountInDefaultCurrency: input.amount,
      alertThresholdPercent: input.alertThresholdPercent ?? 80,
      isActive: input.isActive !== false,
      createdAt: now
    };
  },

  // 4. Cập nhật ngân sách local
  updateBudget: async (id: string, input: BudgetInput): Promise<Budget> => {
    const db = await LocalDatabase.getDb();
    const now = new Date().toISOString();

    await db.runAsync(
      `UPDATE budgets 
       SET name = ?, category_id = ?, amount = ?, budget_month = ?, alert_threshold_percent = ?, is_active = ?, updated_at = ?, sync_status = 'pending_update'
       WHERE id = ?`,
      [
        input.name,
        input.categoryId || null,
        input.amount,
        input.budgetMonth,
        input.alertThresholdPercent ?? 80,
        input.isActive !== false ? 1 : 0,
        now,
        id
      ]
    );

    // Đẩy vào hàng đợi sync_queue
    const payload = JSON.stringify({
      name: input.name,
      categoryId: input.categoryId || null,
      amount: input.amount,
      budgetMonth: input.budgetMonth,
      alertThresholdPercent: input.alertThresholdPercent ?? 80,
      isActive: input.isActive !== false
    });

    await db.runAsync(
      `INSERT INTO sync_queue (id, entity_type, entity_id, operation, payload, created_at)
       VALUES (?, 'budget', ?, 'UPDATE', ?, ?)`,
      ['sq_' + generateId(), id, payload, now]
    );

    return {
      id,
      name: input.name,
      categoryId: input.categoryId || null,
      amount: input.amount,
      currency: 'VND',
      budgetMonth: input.budgetMonth,
      amountInDefaultCurrency: input.amount,
      alertThresholdPercent: input.alertThresholdPercent ?? 80,
      isActive: input.isActive !== false,
      createdAt: now
    };
  },

  // 5. Xóa ngân sách local
  deleteBudget: async (id: string): Promise<void> => {
    const db = await LocalDatabase.getDb();
    const now = new Date().toISOString();

    await db.runAsync('DELETE FROM budgets WHERE id = ?', [id]);

    await db.runAsync(
      `INSERT INTO sync_queue (id, entity_type, entity_id, operation, payload, created_at)
       VALUES (?, 'budget', ?, 'DELETE', NULL, ?)`,
      ['sq_' + generateId(), id, now]
    );
  }
};
