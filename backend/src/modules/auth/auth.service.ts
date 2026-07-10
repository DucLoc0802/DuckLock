import { pool } from "../../config/db";
import { RegisterDto } from "./dto/register.dto";
import { UserEntity } from "./entities/user.entity";
import { randomUUID } from "crypto";
import bcrypt from "bcrypt";
import { JwtUtil } from "./utils/jwt.util";


export const AuthService = {
  login: async (email: string, password: string) => {
    // 1. SELECT user theo email
    const [rows] = await pool.query<any[]>(
      "SELECT id, name, email, password_hash, avatar_url, default_currency FROM users WHERE email = ?",
      [email]
    );

    const user = rows[0] as UserEntity | undefined;
    if (!user) {
      throw new Error("Email hoặc mật khẩu không đúng");
    }

    // 2. So sánh mật khẩu thô
    const isMatch = await bcrypt.compare(password, user.password_hash as string);
    if (!isMatch) {
      throw new Error("Email hoặc mật khẩu không đúng");
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
      throw new Error("Email đã được sử dụng");
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
