import { pool } from "../../config/db";
import { randomUUID } from "crypto";
import { BudgetEntity } from "./entities/budget.entity";
import { CreateBudgetDto } from "./dto/create-budget.dto";
import { AppError } from "../../utils/app-errors";

export const BudgetsService = {
    createBudgets: async (userId: string, dto: CreateBudgetDto): Promise<any> => {
        const checkNameQuery = `select id from budgets where user_id = ? and name = ?`
        const [check] = await pool.query<any[]>(checkNameQuery, [userId, dto.name]);
        if (check.length > 0) {
            throw new AppError(409, "Tên ngân sách đã tồn tại");
        }
        const id = randomUUID();
        const createBudgetQuery = `insert into budgets (user_id, name, category_id, budget_month, amount, amount_in_default_currency, alert_threshold_percent)
        values (?, ?, ?, ?, ?, ?, ?)`;
        const result = await pool.query<any>(createBudgetQuery, [userId, dto.name, dto.categoryId, dto.budgetMonth, dto.amount, dto.amountInDefaultCurrency, dto.alertThresholdPercent]);
        return result;
    },

    listBudgets: async (userId: string): Promise<any[]> => {
        const listBudgetQuery = `select id, name, amount, currency, budget_month, amount_in_default_currency, alert_threshold_percent
        from budgets where user_id = ? AND deleted_at IS NULL`
        const [result] = await pool.query<any[]>(listBudgetQuery, [userId]);
        return result;
    },

    getBudgetById: async (userId: string, id: string): Promise<any> => {
        const getBudgetQuery = `select id, name, amount, currency, budget_month, amount_in_default_currency, alert_threshold_percent
        from budgets where user_id = ? and id = ? AND deleted_at IS NULL`
        const [result] = await pool.query<any[]>(getBudgetQuery, [userId, id]);
        if (result.length === 0)
            throw new AppError(404, "Không tìm thấy ngân sách");
        return result[0];
    },

    updateBudget: async (userId: string, id: string, dto: CreateBudgetDto): Promise<any> => {
        const updateBudgetQuery = `update budgets
        set name = ? 
        , amount = ? 
        , category_id = ? 
        , amount_in_default_currency = ?
        , alert_threshold_percent = ? 
        , is_active = ?
        where user_id = ?
        and id = ?`;
        const [result] = await pool.query<any>(updateBudgetQuery, [dto.name, dto.amount, dto.categoryId, dto.amountInDefaultCurrency, dto.alertThresholdPercent, dto.isActive, userId, id]);
        if (result.affectedRows === 0)
            throw new AppError(404, "Không tìm thấy ngân sách");
        return {
            id,
            userId,
            name: dto.name,
            amount: dto.amount,
            categoryId: dto.categoryId,
            amountInDefaultCurrency: dto.amountInDefaultCurrency,
            alertThresholdPercent: dto.alertThresholdPercent,
            isActive: dto.isActive
        }
    },

    deleteBudget: async (userId: string, id: string): Promise<any> => {
        const deleteBudgetQuery = `update budgets
        set deleted_at = NOW()
        where user_id = ?
        and id = ?`;
        const [result] = await pool.query<any>(deleteBudgetQuery, [userId, id]);
        if (result.affectedRows === 0)
            throw new AppError(404, "Không tìm thấy ngân sách");
        return {
            success: true,
            message: "Xóa ngân sách thành công"
        };
    },
}