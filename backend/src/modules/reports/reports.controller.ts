import { Request, Response } from "express";
import { ReportsService } from "./reports.service";

export const ReportsController = {
    getMonthlySummary: async (req: Request, res: Response) => {
        try {
            const userId = req.userId!;
            const { month, year } = req.query as any;
            const summary = await ReportsService.getMonthlySummary(userId, { month, year });
            return res.status(200).json({
                success: true,
                data: summary
            });
        } catch (error: any) {
            return res.status(500).json({
                success: false,
                message: error.message || "Internal server error",
            });
        }
    },

    getWeeklySummary: async (req: Request, res: Response) => {
        try {
            const userId = req.userId!;
            const { day } = req.query as any;
            const summary = await ReportsService.getWeeklySummary(userId, { day });
            return res.status(200).json({
                success: true,
                data: summary
            });
        } catch (error: any) {
            return res.status(500).json({
                success: false,
                message: error.message || "Internal server error",
            });
        }
    },

    getDailySummary: async (req: Request, res: Response) => {
        try {
            const userId = req.userId!;
            const { day, month } = req.query as any;
            const summary = await ReportsService.getDailySummary(userId, { day, month });
            return res.status(200).json({
                success: true,
                data: summary
            });
        } catch (error: any) {
            return res.status(500).json({
                success: false,
                message: error.message || "Internal server error",
            });
        }
    },
};