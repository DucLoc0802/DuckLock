import * as SQLite from 'expo-sqlite';

let dbInstance: SQLite.SQLiteDatabase | null = null;

export const LocalDatabase = {
  // 1. Mở hoặc khởi tạo database local
  getDb: async (): Promise<SQLite.SQLiteDatabase> => {
    if (dbInstance) return dbInstance;
    
    // Mở file cơ sở dữ liệu ducklock.db
    dbInstance = await SQLite.openDatabaseAsync('ducklock.db');
    return dbInstance;
  },

  // 2. Chạy migrate tạo bảng khi khởi động app
  initialize: async (): Promise<void> => {
    try {
      const db = await LocalDatabase.getDb();
      
      // Kích hoạt chế độ Write-Ahead Logging (WAL) để tăng tốc đọc ghi SQLite
      await db.execAsync('PRAGMA journal_mode = WAL;');

      // Tạo bảng wallets (ví tài khoản)
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS wallets (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          type TEXT NOT NULL,
          balance REAL NOT NULL,
          currency TEXT NOT NULL,
          interest_rate_percent REAL,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL,
          sync_status TEXT NOT NULL DEFAULT 'synced'
        );
      `);

      // Tạo bảng categories (danh mục chi tiêu)
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS categories (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          icon TEXT NOT NULL,
          color TEXT NOT NULL,
          is_default INTEGER NOT NULL DEFAULT 0,
          sync_status TEXT NOT NULL DEFAULT 'synced'
        );
      `);

      // Tạo bảng transactions (giao dịch)
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS transactions (
          id TEXT PRIMARY KEY,
          category_id TEXT,
          wallet_id TEXT,
          amount REAL NOT NULL,
          currency TEXT NOT NULL,
          type TEXT NOT NULL,
          note TEXT,
          transaction_date TEXT NOT NULL,
          image_uri TEXT,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL,
          sync_status TEXT NOT NULL DEFAULT 'synced'
        );
      `);

      // Tạo bảng budgets (ngân sách chi tiêu)
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS budgets (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          category_id TEXT,
          amount REAL NOT NULL,
          currency TEXT NOT NULL,
          budget_month TEXT NOT NULL,
          alert_threshold_percent REAL DEFAULT 80,
          is_active INTEGER NOT NULL DEFAULT 1,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL,
          sync_status TEXT NOT NULL DEFAULT 'synced'
        );
      `);

      // Tạo bảng sync_queue (hàng đợi đồng bộ)
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS sync_queue (
          id TEXT PRIMARY KEY,
          entity_type TEXT NOT NULL, -- 'wallet' | 'category' | 'transaction' | 'budget'
          entity_id TEXT NOT NULL,
          operation TEXT NOT NULL, -- 'CREATE' | 'UPDATE' | 'DELETE'
          payload TEXT, -- Dữ liệu JSON của bản ghi
          created_at TEXT NOT NULL
        );
      `);

      // Tạo bảng sync_meta (lưu mốc thời gian đồng bộ)
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS sync_meta (
          key TEXT PRIMARY KEY,
          value TEXT NOT NULL
        );
      `);

      // Nâng cấp database mượt mà: tự động kiểm tra và thêm cột image_uri cho database cũ
      try {
        const columns = await db.getAllAsync<any>('PRAGMA table_info(transactions)');
        const hasImageUri = columns.some(col => col.name === 'image_uri');
        if (!hasImageUri) {
          await db.execAsync('ALTER TABLE transactions ADD COLUMN image_uri TEXT;');
          console.log('- Đã thêm cột image_uri vào bảng transactions SQLite thành công.');
        }
      } catch (colErr) {
        console.error('Lỗi khi kiểm tra/nâng cấp cột image_uri:', colErr);
      }

      console.log('➔ SQLite Database initialized successfully!');
    } catch (error) {
      console.error('Lỗi khởi tạo SQLite Database:', error);
      throw error;
    }
  }
};
