import { Request, Response } from "express";
import { WalletsService } from "./wallets.service";
import { asyncHandler } from "../../utils/async-handler";
import { AppError } from "../../utils/app-errors";

export const WalletsController = {
  getAllWallets: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.userId!;
    const wallets = await WalletsService.getAllWallets(userId);
    return res.status(200).json({ success: true, data: wallets });
  }),

  getWalletById: asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = req.userId!;
    const wallet = await WalletsService.getWalletById(userId, id);
    return res.status(200).json({ success: true, data: wallet });
  }),

  createWallet: asyncHandler(async (req: Request, res: Response) => {
    const { name, type, balance, interestRatePercent } = req.body;
    const userId = req.userId!;
    if (!name) throw new AppError(400, "Vui lòng nhập tên ví");
    const wallet = await WalletsService.createWallet(userId, name, type || "BANK", balance || 0, interestRatePercent || null);
    return res.status(201).json({ success: true, data: wallet });
  }),

  updateWallet: asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { name, balance, type } = req.body;
    const userId = req.userId!;
    const wallet = await WalletsService.updateWallet(userId, id, name, balance, type);
    return res.status(200).json({ success: true, data: wallet });
  }),

  deleteWallet: asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = req.userId!;
    const wallet = await WalletsService.deleteWallet(userId, id);
    return res.status(200).json({ success: true, data: wallet });
  }),

  calculateInterest: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.userId!;
    const result = await WalletsService.calculateInterest(userId);
    return res.status(200).json({ success: true, data: result });
  }),

  collectInterest: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.userId!;
    const { wallet_id, period } = req.body;
    if (!wallet_id) throw new AppError(400, "Vui lòng chọn ví tiết kiệm");
    if (!period || !["MONTHLY", "YEARLY"].includes(period))
      throw new AppError(400, "Chu kỳ phải là MONTHLY hoặc YEARLY");
    const result = await WalletsService.collectInterest(userId, wallet_id, period);
    return res.status(200).json({ success: true, data: result });
  }),
};