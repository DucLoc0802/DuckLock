import { Request, Response } from "express";
import { ReportsService } from "./reports.service";
import jwt from "jsonwebtoken";

export const ReportsController = {
    getMonthlySummary: async (req: Request, res: Response) => {
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

            const { month, year } = req.query as any;
            const summary = await ReportsService.getMonthlySummary(decoded.userId, { month, year });
            return res.status(200).json({
                success: true,
                data: summary
            })
        } catch (error: any) {
            return res.status(500).json({
                success: false,
                message: error.message || "Internal server error",
            });
        }
    },

    getWeeklySummary: async (req: Request, res: Response) => {
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

            const { day } = req.query as any;
            const summary = await ReportsService.getWeeklySummary(decoded.userId, { day });
            return res.status(200).json({
                success: true,
                data: summary
            })
        } catch (error: any) {
            return res.status(500).json({
                success: false,
                message: error.message || "Internal server error",
            });
        }
    },

    getDailySummary: async (req: Request, res: Response) => {
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

            const { day, month } = req.query as any;
            const summary = await ReportsService.getDailySummary(decoded.userId, { day, month });
            return res.status(200).json({
                success: true,
                data: summary
            })
        } catch (error: any) {
            return res.status(500).json({
                success: false,
                message: error.message || "Internal server error",
            });
        }
    },
}