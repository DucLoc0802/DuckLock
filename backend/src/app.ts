import express from "express";
import cors from "cors";
import { AuthModule } from "./modules/auth/auth.module";
import { TransactionsModule } from "./modules/transactions/transactions.module";
import { WalletModule } from "./modules/wallets/wallets.module";

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
// Xử lý Route không tìm thấy (404 Handler)
app.use((req, res) =>
  res.status(404).json({ message: `Route ${req.originalUrl} not found` })
);

export default app;
