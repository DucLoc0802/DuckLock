import { Router } from "express";
import { SyncController } from "./sync.controller";
import { authenticateJWT } from "../../middlewares/auth.middleware";

const router = Router();

// Tất cả các API đồng bộ đều yêu cầu người dùng phải đăng nhập (có token hợp lệ)
router.get("/pull", authenticateJWT, SyncController.pull);
router.post("/push", authenticateJWT, SyncController.push);

export const SyncModule = {
  router
};
