import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

// Tạo hồ chứa kết nối (Connection Pool)
export const pool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD !== undefined ? process.env.DB_PASSWORD : '',
  database: process.env.DB_NAME || 'DuckLock',
  port: parseInt(process.env.DB_PORT || '3306'),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Hàm kiểm tra kết nối khi khởi động ứng dụng
export const connectDB = async (): Promise<void> => {
  try {
    // Lấy một kết nối từ pool để kiểm tra
    const connection = await pool.getConnection();
    console.log('MySQL Connection Pool established successfully.');
    connection.release(); // Trả lại kết nối vào pool
  } catch (error: any) {
    console.error(`Error connecting to MySQL: ${error.message}`);
    process.exit(1);
  }
};
