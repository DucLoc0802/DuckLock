import { Request, Response } from "express";
import { BudgetsService } from "./budgets.service";

export const BudgetsController = {
    createBudgets: async (req: Request, res: Response) => {
        try {
            const userId = req.userId!;
            const { amount, categoryId, name, budgetMonth, amountInDefaultCurrency, alertThresholdPercent } = req.body;
            const budgets = await BudgetsService.createBudgets(userId, { amount, categoryId, name, budgetMonth, amountInDefaultCurrency, alertThresholdPercent });
            return res.status(200).json({
                success: true,
                data: budgets
            });
        } catch (error: any) {
            return res.status(500).json({
                success: false,
                message: error.message || "Internal server error",
            });
        }
    },
    listBudgets: async (req: Request, res: Response) => {
        try {
            const userId = req.userId!;
            const budgets = await BudgetsService.listBudgets(userId);
            return res.status(200).json({
                success: true,
                data: budgets
            });
        } catch (error: any) {
            return res.status(500).json({
                success: false,
                message: error.message || "Internal server error",
            });
        }
    },
    getBudgetById: async (req: Request, res: Response) => {
        try {
            const userId = req.userId!;
            const { id } = req.params;
            const budget = await BudgetsService.getBudgetById(userId, id);
            return res.status(200).json({
                success: true,
                data: budget
            });
        } catch (error: any) {
            return res.status(500).json({
                success: false,
                message: error.message || "Internal server error",
            });
        }
    },
    updateBudget: async (req: Request, res: Response) => {
        try {
            const userId = req.userId!;
            const { id } = req.params;
            const { amount, categoryId, name, budgetMonth, amountInDefaultCurrency, alertThresholdPercent, isActive } = req.body;
            const budget = await BudgetsService.updateBudget(userId, id, { amount, categoryId, name, budgetMonth, amountInDefaultCurrency, alertThresholdPercent, isActive });
            return res.status(200).json({
                success: true,
                data: budget
            });
        } catch (error: any) {
            return res.status(500).json({
                success: false,
                message: error.message || "Internal server error",
            });
        }
    },
    deleteBudget: async (req: Request, res: Response) => {
        try {
            const userId = req.userId!;
            const { id } = req.params;
            const budget = await BudgetsService.deleteBudget(userId, id);
            return res.status(200).json({
                success: true,
                data: budget
            });
        } catch (error: any) {
            return res.status(500).json({
                success: false,
                message: error.message || "Internal server error",
            });
        }
    },
};