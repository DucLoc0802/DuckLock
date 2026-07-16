import { Request, Response } from "express";
import { TransactionsService } from "./transactions.service";
import { CreateTransactionDto } from "./dto/create-transaction.dto";
import { asyncHandler } from "../../utils/async-handler";
import { AppError } from "../../utils/app-errors";

export const TransactionsController = {
  createTransaction: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.userId!;
    const { amount, category, transactionDate, description, type, walletId } = req.body as CreateTransactionDto;

    if (amount === undefined || !category || !transactionDate || !type)
      throw new AppError(400, "Vui lòng nhập đầy đủ thông tin giao dịch");
    if (typeof amount !== "number" || amount <= 0)
      throw new AppError(400, "Số tiền giao dịch phải là một số dương");
    if (isNaN(new Date(transactionDate).getTime()))
      throw new AppError(400, "Ngày giao dịch không hợp lệ");
    if (type !== "expense" && type !== "income")
      throw new AppError(400, "Loại giao dịch phải là expense hoặc income");
    if (!walletId)
      throw new AppError(400, "Vui lòng chọn ví giao dịch");

    const transaction = await TransactionsService.createTransaction(userId, {
      amount,
      category,
      transactionDate: new Date(transactionDate),
      description,
      type,
      walletId,
    });

    return res.status(201).json({
      success: true,
      message: "Tạo giao dịch thành công",
      data: transaction,
    });
  }),

  getTransactionById: asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = req.userId!;
    const transaction = await TransactionsService.getTransactionById(id, userId);

    return res.status(200).json({
      success: true,
      data: transaction,
    });
  }),

  deleteTransaction: asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    if (!id) throw new AppError(400, "Thiếu ID giao dịch");

    const userId = req.userId!;
    const result = await TransactionsService.deleteTransaction(id, userId);

    return res.status(200).json({
      success: true,
      message: "Xóa giao dịch thành công",
      data: result,
    });
  }),

  updateTransaction: asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { amount, category, transactionDate, description, type } = req.body as CreateTransactionDto;

    if (!id) throw new AppError(400, "Thiếu ID giao dịch");
    if (amount !== undefined && (typeof amount !== "number" || amount <= 0))
      throw new AppError(400, "Số tiền phải là số dương");
    if (transactionDate !== undefined && isNaN(new Date(transactionDate).getTime()))
      throw new AppError(400, "Ngày giao dịch không hợp lệ");
    if (type !== undefined && type !== "expense" && type !== "income")
      throw new AppError(400, "Loại giao dịch phải là expense hoặc income");

    const userId = req.userId!;
    const transaction = await TransactionsService.updateTransaction(id, userId, {
      amount,
      category,
      transactionDate,
      description,
      type,
    });

    return res.status(200).json({
      success: true,
      message: "Cập nhật giao dịch thành công",
      data: transaction,
    });
  }),

  getTransaction: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.userId!;
    const transactions = await TransactionsService.getTransaction({ user_id: userId });

    return res.status(200).json({
      success: true,
      message: "Lấy danh sách giao dịch thành công",
      data: transactions,
    });
  }),
};
