import { Request, Response } from "express";
import { TransactionsService } from "./transactions.service";
import { CreateTransactionDto } from "./dto/create-transaction.dto";

export const TransactionsController = {
  createTransaction: async (req: Request, res: Response) => {
    try {
      const userId = req.userId!;
      const { amount, category, transactionDate, description, type, walletId } = req.body as CreateTransactionDto;

      if (amount === undefined || !category || !transactionDate || !type) {
        return res.status(400).json({
          success: false,
          message: "Vui lòng nhập đầy đủ thông tin giao dịch",
        });
      }

      if (typeof amount !== "number" || amount <= 0) {
        return res.status(400).json({
          success: false,
          message: "Số tiền giao dịch phải là một số dương",
        });
      }

      if (isNaN(new Date(transactionDate).getTime())) {
        return res.status(400).json({
          success: false,
          message: "Ngày giao dịch không hợp lệ",
        });
      }

      if (type !== "expense" && type !== "income") {
        return res.status(400).json({
          success: false,
          message: "Loại giao dịch phải là expense hoặc income",
        });
      }

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
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message || "Internal server error",
      });
    }
  },

  getTransactionById: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const userId = req.userId!;
      const transaction = await TransactionsService.getTransactionById(id, userId);

      return res.status(200).json({
        success: true,
        data: transaction
      });
    } catch (error: any) {
      const statusCode = error.message === "Không tìm thấy giao dịch" ? 404 : 500;
      return res.status(statusCode).json({
        success: false,
        message: error.message || "Internal server error"
      });
    }
  },

  deleteTransaction: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      if (!id) {
        return res.status(400).json({ success: false, message: "Thiếu ID giao dịch" });
      }

      const userId = req.userId!;
      const result = await TransactionsService.deleteTransaction(id, userId);
      return res.status(200).json({
        success: true,
        message: "Xóa giao dịch thành công",
        data: result
      });
    } catch (error: any) {
      const statusCode = error.message === "Không tìm thấy giao dịch" ? 404 : 500;
      return res.status(statusCode).json({
        success: false,
        message: error.message || "Internal server error"
      });
    }
  },

  updateTransaction: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { amount, category, transactionDate, description, type } = req.body as CreateTransactionDto;
      if (!id) {
        return res.status(400).json({ success: false, message: "Thiếu ID giao dịch" });
      }

      if (amount !== undefined && (typeof amount !== "number" || amount <= 0)) {
        return res.status(400).json({ success: false, message: "Số tiền phải là số dương" });
      }
      if (transactionDate !== undefined && isNaN(new Date(transactionDate).getTime())) {
        return res.status(400).json({ success: false, message: "Ngày giao dịch không hợp lệ" });
      }
      if (type !== undefined && type !== "expense" && type !== "income") {
        return res.status(400).json({ success: false, message: "Loại giao dịch phải là expense hoặc income" });
      }

      const userId = req.userId!;
      const transaction = await TransactionsService.updateTransaction(id, userId, {
        amount,
        category,
        transactionDate,
        description,
        type
      });

      return res.status(200).json({
        success: true,
        message: "Cập nhật giao dịch thành công",
        data: transaction
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message || "Internal server error",
      });
    }
  },

  getTransaction: async (req: Request, res: Response) => {
    try {
      const userId = req.userId!;
      const transactions = await TransactionsService.getTransaction({ user_id: userId });

      return res.status(200).json({
        success: true,
        message: "Lấy danh sách giao dịch thành công",
        data: transactions,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message || "Internal server error",
      });
    }
  },
};
