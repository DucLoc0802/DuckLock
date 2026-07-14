import { Request, Response } from "express";
import { WalletsService } from "./wallets.service";

export const WalletsController = {
  getAllWallets: async (req: Request, res: Response) => {
    try {
      const userId = req.userId!;
      const wallets = await WalletsService.getAllWallets(userId);
      return res.status(200).json({
        success: true,
        data: wallets
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message || "Internal server error",
      });
    }
  },

  getWalletById: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const userId = req.userId!;
      const wallet = await WalletsService.getWalletById(userId, id);
      return res.status(200).json({
        success: true,
        data: wallet
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message || "Internal server error",
      });
    }
  },

  createWallet: async (req: Request, res: Response) => {
    try {
      const { name, type, balance, interestRatePercent } = req.body;
      const userId = req.userId!;
      const wallet = await WalletsService.createWallet(userId, name, type || "BANK", balance || 0, interestRatePercent || null);
      return res.status(200).json({
        success: true,
        data: wallet
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message || "Internal server error",
      });
    }
  },
  updateWallet: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { name, balance, type } = req.body;
      const userId = req.userId!;
      const wallet = await WalletsService.updateWallet(userId, id, name, balance, type);
      return res.status(200).json({
        success: true,
        data: wallet
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message || "Internal server error",
      });
    }
  },
};