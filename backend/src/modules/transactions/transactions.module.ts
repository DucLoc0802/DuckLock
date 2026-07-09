import { Router } from "express";
import { TransactionsController } from "./transactions.controller";

const router = Router();

router.post("/", TransactionsController.createTransaction);
router.get("/:id", TransactionsController.getTransactionById);
router.delete("/:id", TransactionsController.deleteTransaction);
router.patch("/:id", TransactionsController.updateTransaction);
router.get("/", TransactionsController.getTransaction);
export const TransactionsModule = {
  router,
};
