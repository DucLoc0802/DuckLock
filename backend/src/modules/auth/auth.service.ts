import { pool } from "../../config/db";
import { RegisterDto } from "./dto/register.dto";
import { UserEntity } from "./entities/user.entity";
import { randomUUID } from "crypto";
import bcrypt from "bcrypt";
import { JwtUtil } from "./utils/jwt.util";
import { AppError } from "../../utils/app-errors";

export const AuthService = {
  login: async (email: string, password: string) => {
    // 1. SELECT user theo email
    const [rows] = await pool.query<any[]>(
      "SELECT id, name, email, password_hash, avatar_url, default_currency FROM users WHERE email = ?",
      [email]
    );

    const user = rows[0] as UserEntity | undefined;
    if (!user) {
      throw new AppError(401, "Email hoặc mật khẩu không đúng");
    }

    // 2. So sánh mật khẩu thô
    const isMatch = await bcrypt.compare(password, user.password_hash as string);
    if (!isMatch) {
      throw new AppError(401, "Email hoặc mật khẩu không đúng");
    }

    // Tạo mock token
    const accessToken = JwtUtil.generateAccessToken({ userId: user.id, email: user.email });
    const refreshToken = JwtUtil.generateRefreshToken({ userId: user.id, email: user.email });

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatar_url: user.avatar_url,
        default_currency: user.default_currency
      }
    };
  },

  register: async (dto: RegisterDto) => {
    // 1. Kiểm tra email tồn tại
    const [existing] = await pool.query<any[]>(
      "SELECT id FROM users WHERE email = ?",
      [dto.email]
    );

    if (existing.length > 0) {
      throw new AppError(409, "Email đã được sử dụng");
    }

    // 2. Sinh UUID ở Backend
    const userId = randomUUID();
    const password_hash = await bcrypt.hash(dto.password, 10);
    // 3. INSERT user mới vào MySQL
    await pool.query(
      "INSERT INTO users (id, name, email, password_hash, default_currency) VALUES (?, ?, ?, ?, ?)",
      [userId, dto.name, dto.email, password_hash, 'VND']
    );

    const query = `INSERT INTO wallets (id, user_id, name, type, balance, currency, is_default, sort_order)
VALUES 
  (?, ?, 'Tiền mặt', 'CASH', 0, 'VND', true, 0),
  (?, ?, 'Ngân hàng', 'BANK', 0, 'VND', false, 1),
  (?, ?, 'Tiết kiệm', 'SAVING', 0, 'VND', false, 2)
`;
    const walletId1 = randomUUID();
    const walletId2 = randomUUID();
    const walletId3 = randomUUID();
    await pool.query(
      query,
      [walletId1, userId, walletId2, userId, walletId3, userId]
    );

    // Seed 9 danh mục mặc định cho user mới có ID tĩnh đồng nhất với client SQLite
    const categoriesQuery = `INSERT INTO categories (id, user_id, name, icon, color, is_default, created_at, updated_at)
VALUES 
  ('food', ?, 'Ăn uống', '🍜', '#FFD966', true, NOW(), NOW()),
  ('transport', ?, 'Di chuyển', '🛵', '#CDEFD5', true, NOW(), NOW()),
  ('shopping', ?, 'Mua sắm', '🛍️', '#FFD8BE', true, NOW(), NOW()),
  ('bills', ?, 'Hóa đơn', '🧾', '#DDEBFF', true, NOW(), NOW()),
  ('fun', ?, 'Giải trí', '🎮', '#FEE2E2', true, NOW(), NOW()),
  ('health', ?, 'Sức khỏe', '💊', '#DCFCE7', true, NOW(), NOW()),
  ('salary', ?, 'Lương', '💰', '#D6F5DD', true, NOW(), NOW()),
  ('gym', ?, 'Gym', '💪', '#E9D5FF', false, NOW(), NOW()),
  ('coffee', ?, 'Cà phê', '☕', '#FDE68A', false, NOW(), NOW())
`;
    await pool.query(categoriesQuery, [
      userId, userId, userId, userId, userId, userId, userId, userId, userId
    ]);

    const accessToken = JwtUtil.generateAccessToken({ userId, email: dto.email });
    const refreshToken = JwtUtil.generateRefreshToken({ userId, email: dto.email });

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      user: {
        id: userId,
        name: dto.name,
        email: dto.email,
        avatar_url: null,
        default_currency: 'VND'
      }
    };
  }
};
