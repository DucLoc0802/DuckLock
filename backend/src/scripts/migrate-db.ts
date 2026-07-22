import { pool } from "../config/db";

async function migrateDatabase() {
  console.log("=== BẮT ĐẦU NÂNG CẤP CƠ SỞ DỮ LIỆU DUCKLOCK ===");
  try {
    // 1. Tự động tạo bảng proof_images nếu chưa có
    console.log("\nĐang khởi tạo bảng proof_images...");
    await pool.query(`
      CREATE TABLE IF NOT EXISTS proof_images (
        id VARCHAR(36) PRIMARY KEY,
        user_id VARCHAR(36) NOT NULL,
        image_url VARCHAR(255) NOT NULL,
        status ENUM('PENDING', 'PROCESSED') DEFAULT 'PENDING',
        captured_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        deleted_at TIMESTAMP NULL DEFAULT NULL
      )
    `);
    console.log("- Bảng proof_images đã sẵn sàng.");

    const tables = ['wallets', 'transactions', 'budgets', 'categories', 'proof_images'];
    
    for (const table of tables) {
      console.log(`\nĐang xử lý bảng: ${table}...`);
      
      // 1. Kiểm tra các cột hiện có
      const [columns] = await pool.query<any[]>(`DESCRIBE ${table}`);
      const columnNames = columns.map(col => col.Field.toLowerCase());
      
      // 2. Thêm created_at nếu chưa có
      if (!columnNames.includes('created_at')) {
        console.log(`- Thêm cột created_at vào bảng ${table}`);
        await pool.query(`ALTER TABLE ${table} ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`);
      } else {
        console.log(`- Cột created_at đã tồn tại.`);
      }

      // 3. Thêm updated_at nếu chưa có
      if (!columnNames.includes('updated_at')) {
        console.log(`- Thêm cột updated_at vào bảng ${table}`);
        await pool.query(`ALTER TABLE ${table} ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`);
      } else {
        console.log(`- Cột updated_at đã tồn tại.`);
      }

      // 4. Thêm deleted_at nếu chưa có
      if (!columnNames.includes('deleted_at')) {
        console.log(`- Thêm cột deleted_at vào bảng ${table}`);
        await pool.query(`ALTER TABLE ${table} ADD COLUMN deleted_at TIMESTAMP NULL DEFAULT NULL`);
      } else {
        console.log(`- Cột deleted_at đã tồn tại.`);
      }
    }
    
    console.log("\n➔ Nâng cấp database MySQL thành công hoàn toàn!");
  } catch (error: any) {
    console.error("\n❌ Lỗi trong quá trình nâng cấp database:", error.message);
    console.error("Vui lòng đảm bảo bạn đã khởi động MySQL Server và cấu hình chính xác trong file .env");
  } finally {
    await pool.end();
  }
}

migrateDatabase();
