import { Router } from "express";
import { ReportsController } from "./reports.controller";

const router = Router();

router.get("/month", ReportsController.getMonthlySummary);
router.get("/week", ReportsController.getWeeklySummary);
router.get("/day", ReportsController.getDailySummary);
export const ReportsModule = {
    router,
};
