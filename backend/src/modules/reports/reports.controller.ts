import { Request, Response } from "express";
import { ReportsService } from "./reports.service";
import { asyncHandler } from "../../utils/async-handler";

export const ReportsController = {
    getMonthlySummary: asyncHandler(async (req: Request, res: Response) => {
        const userId = req.userId!;
        const { month, year } = req.query as any;
        const summary = await ReportsService.getMonthlySummary(userId, { month, year });
        return res.status(200).json({
            success: true,
            data: summary
        });
    }),

    getWeeklySummary: asyncHandler(async (req: Request, res: Response) => {
        const userId = req.userId!;
        const { day } = req.query as any;
        const summary = await ReportsService.getWeeklySummary(userId, { day });
        return res.status(200).json({
            success: true,
            data: summary
        });
    }),

    getDailySummary: asyncHandler(async (req: Request, res: Response) => {
        const userId = req.userId!;
        const { day, month } = req.query as any;
        const summary = await ReportsService.getDailySummary(userId, { day, month });
        return res.status(200).json({
            success: true,
            data: summary
        });
    }),
};