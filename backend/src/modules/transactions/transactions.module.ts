import { Router } from "express";
import { TransactionsController } from "./transactions.controller";
import { authenticateJWT } from "../../middlewares/auth.middleware";

const router = Router();

router.use(authenticateJWT);

router.post("/", TransactionsController.createTransaction);
router.get("/:id", TransactionsController.getTransactionById);
router.delete("/:id", TransactionsController.deleteTransaction);
router.patch("/:id", TransactionsController.updateTransaction);
router.get("/", TransactionsController.getTransaction);
export const TransactionsModule = {
  router,
};
