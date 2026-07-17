import express from "express";
import cors from "cors";
import { AuthModule } from "./modules/auth/auth.module";
import { TransactionsModule } from "./modules/transactions/transactions.module";
import { WalletModule } from "./modules/wallets/wallets.module";
import { ReportsModule } from "./modules/reports/reports.module";
import { BudgetModule } from "./modules/budgets/budgets.module";
import { RecurringTransactionModule } from "./modules/recurring_transactions/recurring-transactions.module";
import { AppError } from "./utils/app-errors";

const app = express();

// Middlewares toàn cục
app.use(cors());
app.use(express.json());

// Tuyến đường hệ thống (Health Check)
app.get("/", (req, res) =>
  res.json({
    message: "Welcome to the DuckLock API!",
    status: "Running",
    timestamp: new Date(),
  })
);
app.get("/api/health", (req, res) =>
  res.json({ status: "ok", uptime: process.uptime() })
);

// Tuyến đường Nghiệp vụ (Business Routes)
app.use("/api/auth", AuthModule.router);
app.use("/api/transactions", TransactionsModule.router);
app.use("/api/wallets", WalletModule.router);
app.use("/api/reports", ReportsModule.router);
app.use("/api/budgets", BudgetModule.router);
app.use("/api/recurring-transactions", RecurringTransactionModule.router);
// Xử lý Route không tìm thấy (404 Handler)
app.use((req, res) =>
  res.status(404).json({ message: `Route ${req.originalUrl} not found` })
);

// Middleware xử lý lỗi tập trung (Đặt dưới cùng các Route)
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error("🔥 System Error Log:", err); // Log lỗi ra console để debug

  // 1. Lỗi nghiệp vụ tự định nghĩa (AppError) → Đọc đúng statusCode
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message
    });
  }

  // 2. Lỗi ràng buộc MySQL (có err.errno)
  if (err.errno) {
    let message = "Đã xảy ra lỗi cơ sở dữ liệu!";
    let statusCode = 400;

    switch (err.errno) {
      case 3819: // CHECK constraint
        if (err.message.includes('chk_wallet_balance_non_negative')) {
          message = "Số dư ví tài khoản không đủ để thực hiện giao dịch!";
        } else {
          message = "Giá trị nhập vào vượt quá giới hạn cho phép!";
        }
        break;
      case 1062: // UNIQUE constraint
        message = "Dữ liệu này đã tồn tại trên hệ thống!";
        break;
      case 1452: // FOREIGN KEY fail (khi insert)
        message = "Liên kết dữ liệu không hợp lệ (Ví hoặc Danh mục không tồn tại)!";
        break;
      case 1451: // FOREIGN KEY fail (khi delete)
        message = "Không thể xóa dữ liệu này vì đang có thông tin khác liên kết sử dụng!";
        break;
    }

    return res.status(statusCode).json({
      success: false,
      message: message
    });
  }

  // 3. Lỗi hệ thống thật sự (bug, crash bất ngờ) → Luôn trả về 500
  return res.status(500).json({
    success: false,
    message: "Đã xảy ra lỗi hệ thống!"
  });
});

export default app;

