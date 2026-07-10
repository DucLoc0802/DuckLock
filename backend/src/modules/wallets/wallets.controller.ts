import { Request, Response } from "express";
import { WalletsService } from "./wallets.service";
import jwt from "jsonwebtoken";

export const WalletsController = {
  getAllWallets: async (req: Request, res: Response) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ success: false, message: "Không tìm thấy token" });
      }
      const token = authHeader.split(" ")[1];
      const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || "ducklockquynhanhaccess";

      let decoded: { userId: string };
      try {
        decoded = jwt.verify(token, ACCESS_SECRET) as { userId: string };
      } catch (jwtError) {
        return res.status(401).json({ success: false, message: "Phiên đăng nhập hết hạn hoặc không hợp lệ" });
      }
      const wallets = await WalletsService.getAllWallets(decoded.userId);
      return res.status(200).json({
        success: true,
        data: wallets
      })
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message || "Internal server error",
      });
    }
  },

  getWalletById: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ success: false, message: "Không tìm thấy token" });
      }
      const token = authHeader.split(" ")[1];
      const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || "ducklockquynhanhaccess";

      let decoded: { userId: string };
      try {
        decoded = jwt.verify(token, ACCESS_SECRET) as { userId: string };
      } catch (jwtError) {
        return res.status(401).json({ success: false, message: "Phiên đăng nhập hết hạn hoặc không hợp lệ" });
      }
      const wallet = await WalletsService.getWalletById(decoded.userId, id);
      return res.status(200).json({
        success: true,
        data: wallet
      })
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message || "Internal server error",
      });
    }
  },
}