import { Router } from "express";
import { WalletsController } from "./wallets.controller";
import { authenticateJWT } from "../../middlewares/auth.middleware";

const router = Router();

router.use(authenticateJWT);

router.get("/", WalletsController.getAllWallets);
router.get("/:id", WalletsController.getWalletById);
router.post("/", WalletsController.createWallet);
router.put("/:id", WalletsController.updateWallet);
router.delete("/:id", WalletsController.deleteWallet);

export const WalletModule = {
    router,
};
