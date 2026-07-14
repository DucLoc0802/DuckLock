import { Router } from "express";
import { ReportsController } from "./reports.controller";
import { authenticateJWT } from "../../middlewares/auth.middleware";

const router = Router();

router.use(authenticateJWT);

router.get("/month", ReportsController.getMonthlySummary);
router.get("/week", ReportsController.getWeeklySummary);
router.get("/day", ReportsController.getDailySummary);
export const ReportsModule = {
    router,
};
