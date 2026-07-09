import jwt from "jsonwebtoken";

const ACCESS_KEY = process.env.JWT_ACCESS_SECRET || "ducklockquynhanhaccess";
const REFRESH_KEY = process.env.JWT_REFRESH_SECRET || "ducklockquynhanhrefresh";

export const JwtUtil = {
  // 1. Tạo Access Token (hết hạn trong 15 phút)
  generateAccessToken: (payload: { userId: string; email: string }): string => {
    return jwt.sign(payload, ACCESS_KEY, { expiresIn: "15m" });
  },

  // 2. Tạo Refresh Token (hết hạn trong 7 ngày)
  generateRefreshToken: (payload: { userId: string; email: string }): string => {
    return jwt.sign(payload, REFRESH_KEY, { expiresIn: "7d" });
  },

  // 3. Xác thực Access Token
  verifyAccessToken: (token: string) => {
    try {
      const decoded = jwt.verify(token, ACCESS_KEY) as { userId: string; email: string };
      return { valid: true, expired: false, data: decoded };
    } catch (error: any) {
      return {
        valid: false,
        expired: error.name === "TokenExpiredError",
        message: error.message
      };
    }
  },

  // 4. Xác thực Refresh Token
  verifyRefreshToken: (token: string) => {
    try {
      const decoded = jwt.verify(token, REFRESH_KEY) as { userId: string; email: string };
      return { valid: true, expired: false, data: decoded };
    } catch (error: any) {
      return {
        valid: false,
        expired: error.name === "TokenExpiredError",
        message: error.message
      };
    }
  }
};
