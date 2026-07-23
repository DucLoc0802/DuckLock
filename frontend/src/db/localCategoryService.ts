import * as SQLite from 'expo-sqlite';
import { Category } from '../types/piggy';

let dbInstance: SQLite.SQLiteDatabase | null = null;

async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (dbInstance) return dbInstance;
  dbInstance = await SQLite.openDatabaseAsync('ducklock.db');
  return dbInstance;
}

export const localCategoryService = {
  // 1. Lấy danh sách danh mục local
  listCategories: async (): Promise<Category[]> => {
    const db = await getDb();
    const rows = await db.getAllAsync<any>('SELECT * FROM categories');
    
    // Lọc trùng theo tên danh mục, ưu tiên giữ lại danh mục có ID động từ server (không thuộc danh sách ID tĩnh)
    const staticIds = ['food', 'transport', 'shopping', 'bills', 'fun', 'health', 'salary', 'gym', 'coffee'];
    const sortedRows = [...rows].sort((a, b) => {
      const aIsStatic = staticIds.includes(a.id);
      const bIsStatic = staticIds.includes(b.id);
      if (aIsStatic && !bIsStatic) return 1;
      if (!aIsStatic && bIsStatic) return -1;
      return 0;
    });

    const uniqueRows: any[] = [];
    const seenNames = new Set<string>();

    for (const row of sortedRows) {
      if (!seenNames.has(row.name)) {
        seenNames.add(row.name);
        uniqueRows.push(row);
      }
    }

    return uniqueRows.map((row: any) => ({
      id: row.id,
      name: row.name,
      icon: row.icon,
      color: row.color,
      isDefault: row.is_default === 1,
      syncState: row.sync_status
    }));
  },

  // 2. Chèn danh mục mặc định nếu chưa có
  seedDefaultCategories: async (): Promise<void> => {
    const db = await getDb();
    const countRow = await db.getFirstAsync<any>('SELECT COUNT(*) as count FROM categories');
    const count = countRow ? countRow.count : 0;

    if (count === 0) {
      console.log('- Bảng categories SQLite trống. Tiến hành seed các danh mục mặc định...');
      const defaultCategories = [
        { id: 'food', name: 'Ăn uống', icon: '🍜', color: '#FFD966', isDefault: 1 },
        { id: 'transport', name: 'Di chuyển', icon: '🛵', color: '#CDEFD5', isDefault: 1 },
        { id: 'shopping', name: 'Mua sắm', icon: '🛍️', color: '#FFD8BE', isDefault: 1 },
        { id: 'bills', name: 'Hóa đơn', icon: '🧾', color: '#DDEBFF', isDefault: 1 },
        { id: 'fun', name: 'Giải trí', icon: '🎮', color: '#FEE2E2', isDefault: 1 },
        { id: 'health', name: 'Sức khỏe', icon: '💊', color: '#DCFCE7', isDefault: 1 },
        { id: 'salary', name: 'Lương', icon: '💰', color: '#D6F5DD', isDefault: 1 },
        { id: 'gym', name: 'Gym', icon: '💪', color: '#E9D5FF', isDefault: 0 },
        { id: 'coffee', name: 'Cà phê', icon: '☕', color: '#FDE68A', isDefault: 0 },
      ];

      for (const cat of defaultCategories) {
        await db.runAsync(
          `INSERT INTO categories (id, name, icon, color, is_default, sync_status)
           VALUES (?, ?, ?, ?, ?, 'synced')`,
          [cat.id, cat.name, cat.icon, cat.color, cat.isDefault]
        );
      }
      console.log('➔ Đã seed danh mục mặc định vào SQLite local thành công!');
    }
  }
};
