import { API_BASE_URL } from '../config/api';
import { LocalDatabase } from '../db/localDatabase';
import { proofImageService } from './proofImageService';

export const syncService = {
  // 1. Đồng bộ 2 chiều toàn bộ dữ liệu
  syncAll: async (token: string | null): Promise<void> => {
    if (!token) return;
    try {
      console.log('🔄 Bắt đầu tiến trình đồng bộ dữ liệu ngầm...');
      
      // 1.1 Đẩy thay đổi local lên server (Push)
      await syncService.pushLocalChanges(token);
      
      // 1.2 Kéo dữ liệu mới từ server về (Pull)
      await syncService.pullServerChanges(token);

      console.log('➔ Đồng bộ dữ liệu thành công!');
    } catch (error) {
      console.error('❌ Lỗi tiến trình đồng bộ ngầm:', error);
    }
  },

  // 2. Gửi các thay đổi từ SQLite local lên MySQL Server
  pushLocalChanges: async (token: string): Promise<void> => {
    const db = await LocalDatabase.getDb();
    
    // Đọc hàng đợi thay đổi từ sync_queue
    const changes = await db.getAllAsync<any>('SELECT * FROM sync_queue ORDER BY created_at ASC');
    if (changes.length === 0) {
      console.log('- Không có thay đổi local cần đồng bộ.');
      return;
    }

    console.log(`- Đang xử lý ${changes.length} thay đổi local để chuẩn bị đồng bộ...`);

    // 2.1 Duyệt qua các thay đổi, nếu có giao dịch chứa ảnh local (chụp offline) thì upload lên backend trước
    for (const change of changes) {
      if (change.entity_type === 'transaction' && (change.operation === 'CREATE' || change.operation === 'UPDATE')) {
        try {
          const payload = change.payload ? JSON.parse(change.payload) : null;
          if (payload && payload.imageUri && (payload.imageUri.startsWith('file://') || payload.imageUri.startsWith('content://') || payload.imageUri.startsWith('ph://'))) {
            console.log(`- Phát hiện ảnh hóa đơn local: ${payload.imageUri}. Đang tải lên backend...`);
            
            // Upload ảnh lên API backend
            const uploaded = await proofImageService.uploadImage(payload.imageUri, token);
            console.log(`- Tải ảnh lên thành công. Link online: ${uploaded.imageUri}`);
            
            // Cập nhật lại payload với link online mới
            payload.imageUri = uploaded.imageUri;
            
            // Cập nhật lại trong sync_queue của SQLite local
            const newPayloadStr = JSON.stringify(payload);
            await db.runAsync('UPDATE sync_queue SET payload = ? WHERE id = ?', [newPayloadStr, change.id]);
            
            // Cập nhật lại cột image_uri trong bảng transactions của SQLite local
            await db.runAsync('UPDATE transactions SET image_uri = ? WHERE id = ?', [uploaded.imageUri, change.entity_id]);
            
            // Thay thế payload trong đối tượng change bộ nhớ tạm để đẩy lên server
            change.payload = newPayloadStr;
          }
        } catch (uploadErr) {
          console.error('❌ Lỗi upload ảnh khi đồng bộ giao dịch:', uploadErr);
        }
      }
    }

    // Chuẩn bị payload gửi lên sync API
    const formattedChanges = changes.map(change => ({
      entity_type: change.entity_type,
      entity_id: change.entity_id,
      operation: change.operation,
      payload: change.payload ? JSON.parse(change.payload) : null,
      created_at: change.created_at,
      updated_at: change.created_at
    }));

    // Gọi API POST /api/sync/push
    const response = await fetch(`${API_BASE_URL}/sync/push`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ changes: formattedChanges })
    });

    const result = await response.json();
    if (!response.ok || !result.success) {
      throw new Error(result.message || 'Push dữ liệu đồng bộ thất bại');
    }

    // Xóa hàng đợi thay đổi sau khi đồng bộ lên server thành công
    const changeIds = changes.map(c => c.id);
    for (const id of changeIds) {
      await db.runAsync('DELETE FROM sync_queue WHERE id = ?', [id]);
    }

    // Cập nhật trạng thái synced cho các ví & giao dịch local
    for (const change of changes) {
      const table = change.entity_type === 'wallet' ? 'wallets' : 
                    change.entity_type === 'transaction' ? 'transactions' : 
                    change.entity_type === 'budget' ? 'budgets' : 'categories';
      await db.runAsync(`UPDATE ${table} SET sync_status = 'synced' WHERE id = ?`, [change.entity_id]);
    }
    
    console.log('- Đẩy dữ liệu local thành công!');
  },

  // 3. Kéo các thay đổi mới từ MySQL Server về lưu SQLite local
  pullServerChanges: async (token: string): Promise<void> => {
    const db = await LocalDatabase.getDb();

    // Lấy thời gian đồng bộ cuối cùng từ sync_meta
    const metaRecord = await db.getFirstAsync<any>("SELECT value FROM sync_meta WHERE key = 'last_pulled_at'");
    const lastPulledAt = metaRecord ? metaRecord.value : '0';

    // Gọi API GET /api/sync/pull?since=lastPulledAt
    const response = await fetch(`${API_BASE_URL}/sync/pull?since=${lastPulledAt}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const result = await response.json();
    if (!response.ok || !result.success) {
      throw new Error(result.message || 'Pull dữ liệu đồng bộ thất bại');
    }

    const { serverTime, wallets, categories, transactions, budgets } = result.data;

    // A. ĐỒNG BỘ VÍ (WALLETS)
    // 1. Chèn hoặc cập nhật các ví hoạt động
    for (const w of wallets.active) {
      await db.runAsync(
        `INSERT INTO wallets (id, name, type, balance, currency, interest_rate_percent, created_at, updated_at, sync_status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'synced')
         ON CONFLICT(id) DO UPDATE SET
           name=excluded.name,
           type=excluded.type,
           balance=excluded.balance,
           currency=excluded.currency,
           interest_rate_percent=excluded.interest_rate_percent,
           updated_at=excluded.updated_at,
           sync_status='synced'`,
        [w.id, w.name, w.type, w.balance, w.currency, w.interest_rate_percent, w.created_at, w.updated_at]
      );
    }
    // 2. Xóa các ví đã bị xóa trên server
    for (const id of wallets.deleted) {
      await db.runAsync('DELETE FROM wallets WHERE id = ?', [id]);
    }

    // B. ĐỒNG BỘ DANHMỤC (CATEGORIES)
    for (const c of categories.active) {
      await db.runAsync(
        `INSERT INTO categories (id, name, icon, color, is_default, sync_status)
         VALUES (?, ?, ?, ?, ?, 'synced')
         ON CONFLICT(id) DO UPDATE SET
           name=excluded.name,
           icon=excluded.icon,
           color=excluded.color,
           is_default=excluded.is_default,
           sync_status='synced'`,
        [c.id, c.name, c.icon, c.color, c.is_default]
      );
    }
    for (const id of categories.deleted) {
      await db.runAsync('DELETE FROM categories WHERE id = ?', [id]);
    }

    // C. ĐỒNG BỘ GIAO DỊCH (TRANSACTIONS)
    for (const t of transactions.active) {
      await db.runAsync(
        `INSERT INTO transactions (id, category_id, wallet_id, amount, currency, type, note, transaction_date, created_at, updated_at, sync_status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'synced')
         ON CONFLICT(id) DO UPDATE SET
           category_id=excluded.category_id,
           wallet_id=excluded.wallet_id,
           amount=excluded.amount,
           currency=excluded.currency,
           type=excluded.type,
           note=excluded.note,
           transaction_date=excluded.transaction_date,
           updated_at=excluded.updated_at,
           sync_status='synced'`,
        [t.id, t.category_id, t.wallet_id, t.amount, t.currency, t.type, t.note, t.transaction_date, t.created_at, t.updated_at]
      );
    }
    for (const id of transactions.deleted) {
      await db.runAsync('DELETE FROM transactions WHERE id = ?', [id]);
    }

    // D. ĐỒNG BỘ NGÂN SÁCH (BUDGETS)
    for (const b of budgets.active) {
      await db.runAsync(
        `INSERT INTO budgets (id, name, category_id, amount, currency, budget_month, alert_threshold_percent, is_active, created_at, updated_at, sync_status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'synced')
         ON CONFLICT(id) DO UPDATE SET
           name=excluded.name,
           category_id=excluded.category_id,
           amount=excluded.amount,
           currency=excluded.currency,
           budget_month=excluded.budget_month,
           alert_threshold_percent=excluded.alert_threshold_percent,
           is_active=excluded.is_active,
           updated_at=excluded.updated_at,
           sync_status='synced'`,
        [b.id, b.name, b.category_id, b.amount, b.currency, b.budget_month, b.alert_threshold_percent, b.is_active, b.created_at, b.updated_at]
      );
    }
    for (const id of budgets.deleted) {
      await db.runAsync('DELETE FROM budgets WHERE id = ?', [id]);
    }

    // Cập nhật lại mốc thời gian đồng bộ cuối cùng vào SQLite
    await db.runAsync(
      "INSERT INTO sync_meta (key, value) VALUES ('last_pulled_at', ?) ON CONFLICT(key) DO UPDATE SET value=excluded.value",
      [serverTime]
    );

    console.log(`- Kéo dữ liệu server thành công. Mốc thời gian mới: ${serverTime}`);
  }
};
