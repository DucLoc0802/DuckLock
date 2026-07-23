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

    // 2.1 Kiểm tra số dư ví nếu là giao dịch chi tiêu (EXPENSE)
    const wallet = await db.getFirstAsync<any>('SELECT balance, name FROM wallets WHERE id = ?', [input.walletId]);
    if (input.type === 'expense') {
      const currentBalance = wallet ? wallet.balance : 0;
      if (currentBalance < input.amount) {
        throw new Error(`Số dư ví "${wallet?.name || 'Tài khoản'}" không đủ để thực hiện chi tiêu này.`);
      }
    }

    // Cập nhật số dư ví tương ứng trong SQLite local
    const changeAmount = input.type === 'expense' ? -input.amount : input.amount;
    await db.runAsync(
      'UPDATE wallets SET balance = balance + ?, updated_at = ? WHERE id = ?',
      [changeAmount, now, input.walletId]
    );

    // 2.2 Lưu giao dịch vào SQLite local (Lưu cả image_uri)
    await db.runAsync(
      `INSERT INTO transactions (id, category_id, wallet_id, amount, currency, type, note, transaction_date, image_uri, created_at, updated_at, sync_status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, input.categoryId, input.walletId, input.amount, 'VND', input.type, input.note, input.transactionDate, input.imageUri || null, now, now, 'pending_create']
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
      // Đọc ví mới để check số dư sau khi thay đổi
      const oldWallet = await db.getFirstAsync<any>('SELECT balance, name FROM wallets WHERE id = ?', [oldTx.wallet_id]);
      const newWallet = await db.getFirstAsync<any>('SELECT balance, name FROM wallets WHERE id = ?', [input.walletId]);
      
      // Giả lập số dư dự kiến sau khi sửa giao dịch:
      let expectedBalance = newWallet ? newWallet.balance : 0;
      if (oldTx.wallet_id === input.walletId) {
        const refundOld = oldTx.type === 'expense' ? oldTx.amount : -oldTx.amount;
        const changeNew = input.type === 'expense' ? -input.amount : input.amount;
        expectedBalance = expectedBalance + refundOld + changeNew;
      } else {
        // Nếu chuyển sang ví khác:
        // Hoàn trả thu nhập (trừ tiền ví cũ) thì có thể bị âm ví cũ
        if (oldTx.type === 'income') {
          const oldExpected = (oldWallet ? oldWallet.balance : 0) - oldTx.amount;
          if (oldExpected < 0) {
            throw new Error(`Không thể sửa giao dịch vì số dư ví cũ "${oldWallet?.name}" sẽ bị âm.`);
          }
        }
        // Check ví mới sau khi trừ chi tiêu
        if (input.type === 'expense') {
          expectedBalance = expectedBalance - input.amount;
        }
      }

      if (expectedBalance < 0) {
        throw new Error(`Số dư ví "${newWallet?.name || 'Tài khoản'}" không đủ để sửa giao dịch này.`);
      }

      // Đã hợp lệ, tiến hành cập nhật ví
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
