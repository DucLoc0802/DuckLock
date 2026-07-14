import { Router } from "express";
import { BudgetsController } from "./budgets.controller";
import { authenticateJWT } from "../../middlewares/auth.middleware";

const router = Router();

router.use(authenticateJWT);
router.post("/", BudgetsController.createBudgets);
router.get("/", BudgetsController.listBudgets);
router.get("/:id", BudgetsController.getBudgetById);
router.put("/:id", BudgetsController.updateBudget);
router.delete("/:id", BudgetsController.deleteBudget);
export const BudgetModule = {
    router,
};
