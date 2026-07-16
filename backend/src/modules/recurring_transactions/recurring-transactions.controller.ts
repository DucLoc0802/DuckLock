import { Request, Response } from "express";
import { RecurringTransactionsService } from "./recurring-transactions.service";

export const RecurringTransactionsController = {
    createRecurringTransaction: async (req: Request, res: Response) => {
        try {
            const userId = req.userId!;
            const { walletId, categoryId, name, amount, type, description, frequency, dayOfPeriod, startDate, endDate, nextExecutionDate } = req.body;
            const result = await RecurringTransactionsService.createRecurringTransaction(userId, {
                walletId, categoryId, name, amount, type, description, frequency, dayOfPeriod, startDate, endDate, nextExecutionDate,
            });
            return res.status(201).json({
                success: true,
                data: result,
            });
        } catch (error: any) {
            return res.status(500).json({
                success: false,
                message: error.message || "Internal server error",
            });
        }
    },

    listRecurringTransactions: async (req: Request, res: Response) => {
        try {
            const userId = req.userId!;
            const result = await RecurringTransactionsService.listRecurringTransactions(userId);
            return res.status(200).json({
                success: true,
                data: result,
            });
        } catch (error: any) {
            return res.status(500).json({
                success: false,
                message: error.message || "Internal server error",
            });
        }
    },

    getRecurringTransactionById: async (req: Request, res: Response) => {
        try {
            const userId = req.userId!;
            const { id } = req.params;
            const result = await RecurringTransactionsService.getRecurringTransactionById(userId, id);
            return res.status(200).json({
                success: true,
                data: result,
            });
        } catch (error: any) {
            return res.status(500).json({
                success: false,
                message: error.message || "Internal server error",
            });
        }
    },

    updateRecurringTransaction: async (req: Request, res: Response) => {
        try {
            const userId = req.userId!;
            const { id } = req.params;
            const { walletId, categoryId, name, amount, type, description, frequency, dayOfPeriod, startDate, endDate, nextExecutionDate, isActive } = req.body;
            const result = await RecurringTransactionsService.updateRecurringTransaction(userId, id, {
                walletId, categoryId, name, amount, type, description, frequency, dayOfPeriod, startDate, endDate, nextExecutionDate, isActive,
            });
            return res.status(200).json({
                success: true,
                data: result,
            });
        } catch (error: any) {
            return res.status(500).json({
                success: false,
                message: error.message || "Internal server error",
            });
        }
    },

    deleteRecurringTransaction: async (req: Request, res: Response) => {
        try {
            const userId = req.userId!;
            const { id } = req.params;
            const result = await RecurringTransactionsService.deleteRecurringTransaction(userId, id);
            return res.status(200).json({
                success: true,
                data: result,
            });
        } catch (error: any) {
            return res.status(500).json({
                success: false,
                message: error.message || "Internal server error",
            });
        }
    },

    getDueRecurringTransactions: async (req: Request, res: Response) => {
        try {
            const userId = req.userId!;
            const result = await RecurringTransactionsService.getDueRecurringTransactions(userId);
            return res.status(200).json({
                success: true,
                data: result,
            });
        } catch (error: any) {
            return res.status(500).json({
                success: false,
                message: error.message || "Internal server error",
            });
        }
    },

    confirmRecurringTransaction: async (req: Request, res: Response) => {
        try {
            const userId = req.userId!;
            const { id } = req.params;
            const result = await RecurringTransactionsService.confirmRecurringTransaction(userId, id);
            return res.status(200).json({
                success: true,
                data: result,
            });
        } catch (error: any) {
            return res.status(500).json({
                success: false,
                message: error.message || "Internal server error",
            });
        }
    },
};