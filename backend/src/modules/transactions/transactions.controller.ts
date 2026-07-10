import { Request, Response } from "express";
import { TransactionsService } from "./transactions.service";
import { CreateTransactionDto } from "./dto/create-transaction.dto";
import jwt from "jsonwebtoken";

export const TransactionsController = {
  createTransaction: async (req: Request, res: Response) => {
    try {
      const { amount, category, transactionDate, description, type } = req.body as CreateTransactionDto;

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

      const transaction = await TransactionsService.createTransaction({
        amount,
        category,
        transactionDate: new Date(transactionDate),
        description,
        type,
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

      // 1. Xác thực JWT Token của người dùng
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

      // 2. Gọi Service và truyền thêm userId để kiểm tra quyền sở hữu
      const transaction = await TransactionsService.getTransactionById(id, decoded.userId);

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

      // 1. Xác thực JWT Token của người dùng
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
        return res.status(401).json({ success: false, message: "Token không hợp lệ hoặc đã hết hạn" });
      }

      // 2. Gọi Service truyền cả id và userId để đảm bảo chỉ được xóa giao dịch của chính mình
      const result = await TransactionsService.deleteTransaction(id, decoded.userId);
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

      // 1. Xác thực JWT Token của người dùng
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
        return res.status(401).json({ success: false, message: "Token không hợp lệ hoặc đã hết hạn" });
      }

      // Validation đầu vào
      if (amount !== undefined && (typeof amount !== "number" || amount <= 0)) {
        return res.status(400).json({ success: false, message: "Số tiền phải là số dương" });
      }
      if (transactionDate !== undefined && isNaN(new Date(transactionDate).getTime())) {
        return res.status(400).json({ success: false, message: "Ngày giao dịch không hợp lệ" });
      }
      if (type !== undefined && type !== "expense" && type !== "income") {
        return res.status(400).json({ success: false, message: "Loại giao dịch phải là expense hoặc income" });
      }

      // 2. Truyền thêm userId đã giải mã từ Token
      const transaction = await TransactionsService.updateTransaction(id, decoded.userId, {
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
      // 1. Lấy token từ Header "Authorization: Bearer <token>"
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({
          success: false,
          message: "Không tìm thấy token xác thực hoặc token không hợp lệ",
        });
      }

      const token = authHeader.split(" ")[1];

      // 2. Giải mã token để lấy userId
      const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || "ducklockquynhanhaccess";
      let decoded: { userId: string };
      try {
        decoded = jwt.verify(token, ACCESS_SECRET) as { userId: string };
      } catch (jwtError: any) {
        // Trả về 401 khi token không hợp lệ hoặc hết hạn (thay vì 500)
        return res.status(401).json({
          success: false,
          message: jwtError.name === "TokenExpiredError"
            ? "Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại"
            : "Token không hợp lệ: " + jwtError.message,
        });
      }

      // 3. Gọi Service và truyền đúng userId đã giải mã được
      const transactions = await TransactionsService.getTransaction({ user_id: decoded.userId });

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
