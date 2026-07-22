import { LocalDatabase } from './localDatabase';
import { Wallet } from '../types/piggy';

const generateId = () => {
  return 'wal_' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
};

export const localWalletService = {
  // 1. Lấy danh sách ví local
  listWallets: async (): Promise<Wallet[]> => {
    const db = await LocalDatabase.getDb();
    const rows = await db.getAllAsync<any>('SELECT * FROM wallets');
    return rows.map(row => ({
      id: row.id,
      name: row.name,
      type: row.type,
      balance: row.balance,
      currency: row.currency,
      interest_rate_percent: row.interest_rate_percent,
      created_at: row.created_at
    }));
  },

  // 2. Thêm mới ví local
  createWallet: async (name: string, type: string, balance: number, currency: string, interestRate: number | null): Promise<Wallet> => {
    const db = await LocalDatabase.getDb();
    const id = generateId();
    const now = new Date().toISOString();

    // 2.1 Thêm vào SQLite local
    await db.runAsync(
      `INSERT INTO wallets (id, name, type, balance, currency, interest_rate_percent, created_at, updated_at, sync_status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending_create')`,
      [id, name, type, balance, currency, interestRate, now, now]
    );

    // 2.2 Đưa vào sync_queue hàng đợi đồng bộ
    const payload = JSON.stringify({ name, type, balance, currency, interest_rate_percent: interestRate });
    await db.runAsync(
      `INSERT INTO sync_queue (id, entity_type, entity_id, operation, payload, created_at)
       VALUES (?, 'wallet', ?, 'CREATE', ?, ?)`,
      ['sq_' + generateId(), id, payload, now]
    );

    return {
      id,
      name,
      type: type as any,
      balance,
      currency,
      interest_rate_percent: interestRate,
      created_at: now
    };
  },

  // 3. Cập nhật ví local
  updateWallet: async (id: string, name: string, type: string, balance: number, currency: string, interestRate: number | null): Promise<void> => {
    const db = await LocalDatabase.getDb();
    const now = new Date().toISOString();

    // 3.1 Cập nhật SQLite local
    await db.runAsync(
      `UPDATE wallets 
       SET name = ?, type = ?, balance = ?, currency = ?, interest_rate_percent = ?, updated_at = ?, sync_status = 'pending_update'
       WHERE id = ?`,
      [name, type, balance, currency, interestRate, now, id]
    );

    // 3.2 Đưa vào sync_queue hàng đợi đồng bộ
    const payload = JSON.stringify({ name, type, balance, currency, interest_rate_percent: interestRate });
    await db.runAsync(
      `INSERT INTO sync_queue (id, entity_type, entity_id, operation, payload, created_at)
       VALUES (?, 'wallet', ?, 'UPDATE', ?, ?)`,
      ['sq_' + generateId(), id, payload, now]
    );
  },

  // 4. Xóa ví local (Soft Delete trên client)
  deleteWallet: async (id: string): Promise<void> => {
    const db = await LocalDatabase.getDb();
    const now = new Date().toISOString();

    // 4.1 Xóa bản ghi local
    await db.runAsync('DELETE FROM wallets WHERE id = ?', [id]);

    // 4.2 Thêm vào sync_queue để backend thực thi xóa
    await db.runAsync(
      `INSERT INTO sync_queue (id, entity_type, entity_id, operation, payload, created_at)
       VALUES (?, 'wallet', ?, 'DELETE', NULL, ?)`,
      ['sq_' + generateId(), id, now]
    );
  }
};
