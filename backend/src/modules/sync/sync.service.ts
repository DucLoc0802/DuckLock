import { pool } from "../../config/db";
import { AppError } from "../../utils/app-errors";

export const SyncService = {
  // 1. API Pull: Lấy tất cả dữ liệu thay đổi trên server kể từ mốc thời gian 'since'
  pullData: async (userId: string, since: string | number): Promise<any> => {
    // Parse since sang dạng Date để truy vấn
    let sinceDate: Date;
    if (!since) {
      sinceDate = new Date(0); // 1970-01-01
    } else if (typeof since === 'number' || !isNaN(Number(since))) {
      sinceDate = new Date(Number(since));
    } else {
      sinceDate = new Date(since);
    }

    if (isNaN(sinceDate.getTime())) {
      sinceDate = new Date(0);
    }

    // Thời gian hiện tại của server để trả về cho client làm mốc pull tiếp theo
    const serverTime = new Date().toISOString();

    // Query các bản ghi mới/sửa đổi/xóa của user
    const walletsQuery = `
      SELECT id, name, type, balance, currency, interest_rate_percent, created_at, updated_at, deleted_at
      FROM wallets 
      WHERE user_id = ? AND (updated_at > ? OR deleted_at > ?)
    `;
    const categoriesQuery = `
      SELECT id, name, icon, color, is_default, created_at, updated_at, deleted_at
      FROM categories 
      WHERE (user_id = ? OR user_id IS NULL) AND (updated_at > ? OR deleted_at > ?)
    `;
    const transactionsQuery = `
      SELECT id, category_id, wallet_id, amount, currency, type, description as note, transaction_date, created_at, updated_at, deleted_at
      FROM transactions 
      WHERE user_id = ? AND (updated_at > ? OR deleted_at > ?)
    `;
    const budgetsQuery = `
      SELECT id, name, category_id, amount, currency, budget_month, alert_threshold_percent, is_active, created_at, updated_at, deleted_at
      FROM budgets 
      WHERE user_id = ? AND (updated_at > ? OR deleted_at > ?)
    `;

    const [wallets] = await pool.query<any[]>(walletsQuery, [userId, sinceDate, sinceDate]);
    const [categories] = await pool.query<any[]>(categoriesQuery, [userId, sinceDate, sinceDate]);
    const [transactions] = await pool.query<any[]>(transactionsQuery, [userId, sinceDate, sinceDate]);
    const [budgets] = await pool.query<any[]>(budgetsQuery, [userId, sinceDate, sinceDate]);

    // Định dạng lại các bản ghi đã xóa
    const mapSyncData = (list: any[]) => {
      const active = list.filter(item => item.deleted_at === null);
      const deleted = list.filter(item => item.deleted_at !== null).map(item => item.id);
      return { active, deleted };
    };

    const walletData = mapSyncData(wallets);
    const categoryData = mapSyncData(categories);
    const transactionData = mapSyncData(transactions);
    const budgetData = mapSyncData(budgets);

    return {
      serverTime,
      wallets: walletData,
      categories: categoryData,
      transactions: transactionData,
      budgets: budgetData,
    };
  },

  // 2. API Push: Cập nhật các thay đổi từ SQLite local của thiết bị khách lên MySQL
  pushData: async (userId: string, changes: any[]): Promise<any> => {
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      for (const change of changes) {
        const { entity_type, entity_id, operation, payload, created_at, updated_at } = change;
        const recordTime = updated_at ? new Date(updated_at) : new Date();

        if (operation === 'DELETE') {
          // Thực hiện Soft Delete
          let deleteQuery = '';
          if (entity_type === 'wallet') {
            deleteQuery = `UPDATE wallets SET deleted_at = NOW(), updated_at = NOW() WHERE id = ? AND user_id = ?`;
          } else if (entity_type === 'transaction') {
            deleteQuery = `UPDATE transactions SET deleted_at = NOW(), updated_at = NOW() WHERE id = ? AND user_id = ?`;
          } else if (entity_type === 'category') {
            deleteQuery = `UPDATE categories SET deleted_at = NOW(), updated_at = NOW() WHERE id = ? AND user_id = ?`;
          } else if (entity_type === 'budget') {
            deleteQuery = `UPDATE budgets SET deleted_at = NOW(), updated_at = NOW() WHERE id = ? AND user_id = ?`;
          }

          if (deleteQuery) {
            await connection.query(deleteQuery, [entity_id, userId]);
          }
          continue;
        }

        // Với operation CREATE / UPDATE
        const data = typeof payload === 'string' ? JSON.parse(payload) : payload;

        if (entity_type === 'wallet') {
          const insertWallet = `
            INSERT INTO wallets (id, user_id, name, type, balance, currency, interest_rate_percent, created_at, updated_at, deleted_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NULL)
            ON DUPLICATE KEY UPDATE
              name = VALUES(name),
              type = VALUES(type),
              balance = VALUES(balance),
              currency = VALUES(currency),
              interest_rate_percent = VALUES(interest_rate_percent),
              updated_at = VALUES(updated_at),
              deleted_at = NULL
          `;
          const createdTime = created_at ? new Date(created_at) : recordTime;
          await connection.query(insertWallet, [
            entity_id,
            userId,
            data.name,
            data.type || 'BANK',
            data.balance || 0,
            data.currency || 'VND',
            data.interest_rate_percent !== undefined ? data.interest_rate_percent : null,
            createdTime,
            recordTime
          ]);

        } else if (entity_type === 'category') {
          const insertCategory = `
            INSERT INTO categories (id, user_id, name, icon, color, is_default, created_at, updated_at, deleted_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, NULL)
            ON DUPLICATE KEY UPDATE
              name = VALUES(name),
              icon = VALUES(icon),
              color = VALUES(color),
              is_default = VALUES(is_default),
              updated_at = VALUES(updated_at),
              deleted_at = NULL
          `;
          const createdTime = created_at ? new Date(created_at) : recordTime;
          await connection.query(insertCategory, [
            entity_id,
            userId,
            data.name,
            data.icon || '📝',
            data.color || '#9E9E9E',
            data.is_default || false,
            createdTime,
            recordTime
          ]);

        } else if (entity_type === 'transaction') {
          // Kiểm tra và tự động chèn danh mục rỗng nếu chưa tồn tại trong MySQL để tránh lỗi khóa ngoại
          if (data.categoryId) {
            const [catCheck] = await connection.query<any[]>(`SELECT id FROM categories WHERE id = ?`, [data.categoryId]);
            if (catCheck.length === 0) {
              const catName = data.categoryName || 'Khác';
              // Kiểm tra trùng tên danh mục cho user này để tránh lỗi UNIQUE(user_id, name)
              const [nameCheck] = await connection.query<any[]>(
                `SELECT id FROM categories WHERE name = ? AND (user_id = ? OR user_id IS NULL) LIMIT 1`,
                [catName, userId]
              );
              if (nameCheck.length > 0) {
                // Nếu đã có danh mục mang tên đó, đổi categoryId của giao dịch sang ID của danh mục đã tồn tại
                data.categoryId = nameCheck[0].id;
              } else {
                // Nếu chưa có, chèn danh mục mới với ID mới
                const insertDummyCat = `
                  INSERT INTO categories (id, user_id, name, icon, color, is_default, created_at, updated_at)
                  VALUES (?, ?, ?, '📝', '#9E9E9E', false, NOW(), NOW())
                `;
                await connection.query(insertDummyCat, [data.categoryId, userId, catName]);
              }
            }
          }

          const insertTx = `
            INSERT INTO transactions (id, user_id, category_id, wallet_id, amount, currency, amount_in_default_currency, type, transaction_date, description, created_at, updated_at, deleted_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL)
            ON DUPLICATE KEY UPDATE
              category_id = VALUES(category_id),
              wallet_id = VALUES(wallet_id),
              amount = VALUES(amount),
              currency = VALUES(currency),
              amount_in_default_currency = VALUES(amount_in_default_currency),
              type = VALUES(type),
              transaction_date = VALUES(transaction_date),
              description = VALUES(description),
              updated_at = VALUES(updated_at),
              deleted_at = NULL
          `;
          const createdTime = created_at ? new Date(created_at) : recordTime;
          const txDate = data.transactionDate ? new Date(data.transactionDate) : new Date();

          await connection.query(insertTx, [
            entity_id,
            userId,
            data.categoryId || null,
            data.walletId || null,
            data.amount || 0,
            data.currency || 'VND',
            data.amount || 0, // Mặc định tỷ giá 1:1
            data.type ? data.type.toUpperCase() : 'EXPENSE',
            txDate,
            data.note || '',
            createdTime,
            recordTime
          ]);

        } else if (entity_type === 'budget') {
          const insertBudget = `
            INSERT INTO budgets (id, user_id, name, category_id, budget_month, amount, amount_in_default_currency, alert_threshold_percent, is_active, created_at, updated_at, deleted_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL)
            ON DUPLICATE KEY UPDATE
              name = VALUES(name),
              category_id = VALUES(category_id),
              budget_month = VALUES(budget_month),
              amount = VALUES(amount),
              amount_in_default_currency = VALUES(amount_in_default_currency),
              alert_threshold_percent = VALUES(alert_threshold_percent),
              is_active = VALUES(is_active),
              updated_at = VALUES(updated_at),
              deleted_at = NULL
          `;
          const createdTime = created_at ? new Date(created_at) : recordTime;
          await connection.query(insertBudget, [
            entity_id,
            userId,
            data.name,
            data.categoryId || null,
            data.budgetMonth || '',
            data.amount || 0,
            data.amount || 0,
            data.alertThresholdPercent || 80,
            data.isActive !== undefined ? data.isActive : true,
            createdTime,
            recordTime
          ]);
        }
      }

      await connection.commit();
      return { success: true, message: "Đồng bộ dữ liệu thành công" };
    } catch (error: any) {
      await connection.rollback();
      console.error("Lỗi đồng bộ push:", error);
      throw new AppError(500, `Lỗi đồng bộ push: ${error.message}`);
    } finally {
      connection.release();
    }
  }
};
