import { Request, Response } from "express";
import { BudgetsService } from "./budgets.service";
import { asyncHandler } from "../../utils/async-handler";
import { AppError } from "../../utils/app-errors";

export const BudgetsController = {
    createBudgets: asyncHandler(async (req: Request, res: Response) => {
        const userId = req.userId!;
        const { amount, categoryId, name, budgetMonth, amountInDefaultCurrency, alertThresholdPercent } = req.body;
        if (!amount || !budgetMonth)
            throw new AppError(400, "Vui lòng nhập đầy đủ thông tin ngân sách");
        const budgets = await BudgetsService.createBudgets(userId, {
            amount, categoryId, name, budgetMonth, amountInDefaultCurrency, alertThresholdPercent
        });
        return res.status(201).json({ success: true, data: budgets });
    }),

    listBudgets: asyncHandler(async (req: Request, res: Response) => {
        const userId = req.userId!;
        const budgets = await BudgetsService.listBudgets(userId);
        return res.status(200).json({ success: true, data: budgets });
    }),

    getBudgetById: asyncHandler(async (req: Request, res: Response) => {
        const userId = req.userId!;
        const { id } = req.params;
        const budget = await BudgetsService.getBudgetById(userId, id);
        return res.status(200).json({ success: true, data: budget });
    }),

    updateBudget: asyncHandler(async (req: Request, res: Response) => {
        const userId = req.userId!;
        const { id } = req.params;
        const { amount, categoryId, name, budgetMonth, amountInDefaultCurrency, alertThresholdPercent, isActive } = req.body;
        const budget = await BudgetsService.updateBudget(userId, id, {
            amount, categoryId, name, budgetMonth, amountInDefaultCurrency, alertThresholdPercent, isActive
        });
        return res.status(200).json({ success: true, data: budget });
    }),

    deleteBudget: asyncHandler(async (req: Request, res: Response) => {
        const userId = req.userId!;
        const { id } = req.params;
        const budget = await BudgetsService.deleteBudget(userId, id);
        return res.status(200).json({ success: true, data: budget });
    }),
};