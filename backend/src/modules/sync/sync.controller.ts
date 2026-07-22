import { Request, Response } from "express";
import { SyncService } from "./sync.service";
import { asyncHandler } from "../../utils/async-handler";
import { AppError } from "../../utils/app-errors";

export const SyncController = {
  // 1. API Pull: Client kéo dữ liệu thay đổi từ Server về
  pull: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.userId!;
    const { since } = req.query; // Có thể là timestamp hoặc ISO string

    const result = await SyncService.pullData(userId, since as string);
    return res.status(200).json({
      success: true,
      message: "Lấy dữ liệu đồng bộ thành công",
      data: result
    });
  }),

  // 2. API Push: Client đẩy dữ liệu thay đổi từ thiết bị lên Server
  push: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.userId!;
    const { changes } = req.body;

    if (!changes || !Array.isArray(changes)) {
      throw new AppError(400, "Dữ liệu đồng bộ 'changes' không hợp lệ (phải là một mảng)");
    }

    const result = await SyncService.pushData(userId, changes);
    return res.status(200).json({
      success: true,
      message: "Đồng bộ dữ liệu lên server thành công",
      data: result
    });
  })
};
