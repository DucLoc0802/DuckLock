import { pool } from "../config/db";

async function checkTables() {
  try {
    const tables = ['wallets', 'transactions', 'budgets'];
    for (const table of tables) {
      console.log(`\n--- BẢNG: ${table} ---`);
      try {
        const [rows] = await pool.query<any[]>(`DESCRIBE ${table}`);
        rows.forEach(row => {
          console.log(`Cột: ${row.Field} | Kiểu: ${row.Type} | Null: ${row.Null} | Key: ${row.Key} | Default: ${row.Default} | Extra: ${row.Extra}`);
        });
      } catch (err: any) {
        console.error(`Không thể kiểm tra bảng ${table}: ${err.message}`);
      }
    }
  } catch (error: any) {
    console.error("Lỗi kết nối database:", error.message);
  } finally {
    await pool.end();
  }
}

checkTables();
