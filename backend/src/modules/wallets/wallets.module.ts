import { Router } from "express";
import { WalletsController } from "./wallets.controller";

const router = Router();

router.get("/", WalletsController.getAllWallets);
router.get("/:id", WalletsController.getWalletById);
export const WalletModule = {
    router,
};
