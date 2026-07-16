import { Request, Response } from "express";
import { RecurringTransactionsService } from "./recurring-transactions.service";
import { asyncHandler } from "../../utils/async-handler";
import { AppError } from "../../utils/app-errors";

export const RecurringTransactionsController = {
    createRecurringTransaction: asyncHandler(async (req: Request, res: Response) => {
        const userId = req.userId!;
        const { walletId, categoryId, name, amount, type, description, frequency, dayOfPeriod, startDate, endDate, nextExecutionDate } = req.body;
        if (!walletId || !name || !amount || !type || !frequency || !dayOfPeriod || !startDate || !nextExecutionDate)
            throw new AppError(400, "Vui lòng nhập đầy đủ thông tin giao dịch định kỳ");
        const result = await RecurringTransactionsService.createRecurringTransaction(userId, {
            walletId, categoryId, name, amount, type, description, frequency, dayOfPeriod, startDate, endDate, nextExecutionDate,
        });
        return res.status(201).json({ success: true, data: result });
    }),

    listRecurringTransactions: asyncHandler(async (req: Request, res: Response) => {
        const userId = req.userId!;
        const result = await RecurringTransactionsService.listRecurringTransactions(userId);
        return res.status(200).json({ success: true, data: result });
    }),

    getRecurringTransactionById: asyncHandler(async (req: Request, res: Response) => {
        const userId = req.userId!;
        const { id } = req.params;
        const result = await RecurringTransactionsService.getRecurringTransactionById(userId, id);
        return res.status(200).json({ success: true, data: result });
    }),

    updateRecurringTransaction: asyncHandler(async (req: Request, res: Response) => {
        const userId = req.userId!;
        const { id } = req.params;
        const { walletId, categoryId, name, amount, type, description, frequency, dayOfPeriod, startDate, endDate, nextExecutionDate, isActive } = req.body;
        const result = await RecurringTransactionsService.updateRecurringTransaction(userId, id, {
            walletId, categoryId, name, amount, type, description, frequency, dayOfPeriod, startDate, endDate, nextExecutionDate, isActive,
        });
        return res.status(200).json({ success: true, data: result });
    }),

    deleteRecurringTransaction: asyncHandler(async (req: Request, res: Response) => {
        const userId = req.userId!;
        const { id } = req.params;
        const result = await RecurringTransactionsService.deleteRecurringTransaction(userId, id);
        return res.status(200).json({ success: true, data: result });
    }),

    getDueRecurringTransactions: asyncHandler(async (req: Request, res: Response) => {
        const userId = req.userId!;
        const result = await RecurringTransactionsService.getDueRecurringTransactions(userId);
        return res.status(200).json({ success: true, data: result });
    }),

    confirmRecurringTransaction: asyncHandler(async (req: Request, res: Response) => {
        const userId = req.userId!;
        const { id } = req.params;
        const result = await RecurringTransactionsService.confirmRecurringTransaction(userId, id);
        return res.status(200).json({ success: true, data: result });
    }),
};