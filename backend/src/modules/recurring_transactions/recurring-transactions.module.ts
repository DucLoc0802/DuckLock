import { Router } from "express";
import { RecurringTransactionsController } from "./recurring-transactions.controller";
import { authenticateJWT } from "../../middlewares/auth.middleware";

const router = Router();

router.use(authenticateJWT);

router.get("/due", RecurringTransactionsController.getDueRecurringTransactions);
router.post("/", RecurringTransactionsController.createRecurringTransaction);
router.get("/", RecurringTransactionsController.listRecurringTransactions);
router.get("/:id", RecurringTransactionsController.getRecurringTransactionById);
router.put("/:id", RecurringTransactionsController.updateRecurringTransaction);
router.delete("/:id", RecurringTransactionsController.deleteRecurringTransaction);
router.post("/due/:id", RecurringTransactionsController.confirmRecurringTransaction);

export const RecurringTransactionModule = {
    router,
};
