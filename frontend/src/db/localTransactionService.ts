import { LocalDatabase } from './localDatabase';
import { Transaction, CreateTransactionInput } from '../types/piggy';

const generateId = () => {
  return 'tx_' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
};

export const localTransactionService = {
  // 1. Lấy danh sách giao dịch local
  listTransactions: async (): Promise<Transaction[]> => {
    const db = await LocalDatabase.getDb();
    const rows = await db.getAllAsync<any>('SELECT * FROM transactions ORDER BY transaction_date DESC, created_at DESC');
    return rows.map(row => ({
      id: row.id,
      categoryId: row.category_id,
      amount: row.amount,
      type: row.type as any,
      note: row.note || '',
      transactionDate: row.transaction_date,
      createdAt: row.created_at,
      imageUri: row.image_uri || undefined,
      syncState: row.sync_status
    }));
  },

  // 2. Thêm mới giao dịch local
  createTransaction: async (input: CreateTransactionInput): Promise<Transaction> => {
    const db = await LocalDatabase.getDb();
    const id = generateId();
    const now = new Date().toISOString();

    // 2.1 Cập nhật số dư ví tương ứng trong SQLite local
    const changeAmount = input.type === 'expense' ? -input.amount : input.amount;
    await db.runAsync(
      'UPDATE wallets SET balance = balance + ?, updated_at = ? WHERE id = ?',
      [changeAmount, now, input.walletId]
    );

    // 2.2 Lưu giao dịch vào SQLite local (Lưu cả image_uri)
    await db.runAsync(
      `INSERT INTO transactions (id, category_id, wallet_id, amount, currency, type, note, transaction_date, image_uri, created_at, updated_at, sync_status)
       VALUES (?, ?, ?, ?, 'VND', ?, ?, ?, ?, ?, ?, ?, 'pending_create')`,
      [id, input.categoryId, input.walletId, input.amount, input.type, input.note, input.transactionDate, input.imageUri || null, now, now]
    );

    // 2.3 Đăng ký thay đổi vào sync_queue để backend thực thi đồng bộ
    const payload = JSON.stringify({
      categoryId: input.categoryId,
      walletId: input.walletId,
      amount: input.amount,
      type: input.type,
      note: input.note,
      transactionDate: input.transactionDate,
      imageUri: input.imageUri
    });

    await db.runAsync(
      `INSERT INTO sync_queue (id, entity_type, entity_id, operation, payload, created_at)
       VALUES (?, 'transaction', ?, 'CREATE', ?, ?)`,
      ['sq_' + generateId(), id, payload, now]
    );

    return {
      id,
      categoryId: input.categoryId,
      amount: input.amount,
      type: input.type,
      note: input.note,
      transactionDate: input.transactionDate,
      createdAt: now,
      imageUri: input.imageUri,
      syncState: 'pending_create'
    };
  },

  // 3. Sửa giao dịch local
  updateTransaction: async (id: string, input: CreateTransactionInput): Promise<void> => {
    const db = await LocalDatabase.getDb();
    const now = new Date().toISOString();

    // 3.1 Đọc lại giao dịch cũ để tính toán thay đổi số dư ví
    const oldTx = await db.getFirstAsync<any>('SELECT * FROM transactions WHERE id = ?', [id]);
    if (oldTx) {
      // Hoàn lại tiền cho ví cũ
      const oldRefund = oldTx.type === 'expense' ? oldTx.amount : -oldTx.amount;
      await db.runAsync(
        'UPDATE wallets SET balance = balance + ?, updated_at = ? WHERE id = ?',
        [oldRefund, now, oldTx.wallet_id]
      );

      // Trừ/cộng tiền cho ví mới (hoặc ví cũ với số tiền mới)
      const newChange = input.type === 'expense' ? -input.amount : input.amount;
      await db.runAsync(
        'UPDATE wallets SET balance = balance + ?, updated_at = ? WHERE id = ?',
        [newChange, now, input.walletId]
      );
    }

    // 3.2 Cập nhật giao dịch trong SQLite local (Cập nhật cả image_uri)
    await db.runAsync(
      `UPDATE transactions 
       SET category_id = ?, wallet_id = ?, amount = ?, type = ?, note = ?, transaction_date = ?, image_uri = ?, updated_at = ?, sync_status = 'pending_update'
       WHERE id = ?`,
      [input.categoryId, input.walletId, input.amount, input.type, input.note, input.transactionDate, input.imageUri || null, now, id]
    );

    // 3.3 Đăng ký thay đổi vào sync_queue
    const payload = JSON.stringify({
      categoryId: input.categoryId,
      walletId: input.walletId,
      amount: input.amount,
      type: input.type,
      note: input.note,
      transactionDate: input.transactionDate,
      imageUri: input.imageUri
    });

    await db.runAsync(
      `INSERT INTO sync_queue (id, entity_type, entity_id, operation, payload, created_at)
       VALUES (?, 'transaction', ?, 'UPDATE', ?, ?)`,
      ['sq_' + generateId(), id, payload, now]
    );
  },

  // 4. Xóa giao dịch local
  deleteTransaction: async (id: string): Promise<void> => {
    const db = await LocalDatabase.getDb();
    const now = new Date().toISOString();

    // 4.1 Đọc lại giao dịch để hoàn lại số dư ví tương ứng
    const oldTx = await db.getFirstAsync<any>('SELECT * FROM transactions WHERE id = ?', [id]);
    if (oldTx) {
      const refund = oldTx.type === 'expense' ? oldTx.amount : -oldTx.amount;
      await db.runAsync(
        'UPDATE wallets SET balance = balance + ?, updated_at = ? WHERE id = ?',
        [refund, now, oldTx.wallet_id]
      );
    }

    // 4.2 Xóa giao dịch trong SQLite local
    await db.runAsync('DELETE FROM transactions WHERE id = ?', [id]);

    // 4.3 Đăng ký hành động xóa vào sync_queue để đẩy lên MySQL
    await db.runAsync(
      `INSERT INTO sync_queue (id, entity_type, entity_id, operation, payload, created_at)
       VALUES (?, 'transaction', ?, 'DELETE', NULL, ?)`,
      ['sq_' + generateId(), id, now]
    );
  }
};
