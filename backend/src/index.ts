import app from "./app";
import { connectDB } from "./config/db";
import dotenv from "dotenv";

dotenv.config();
const PORT = process.env.PORT || 5000;

// Khởi chạy kết nối Database trước khi Server lắng nghe cổng
connectDB()
  .then(() => {
    app.listen(PORT, () =>
      console.log(`[Server] Running on http://localhost:${PORT}`)
    );
  })
  .catch((err) => {
    console.error("DB connection failed:", err.message);
    process.exit(1);
  });
