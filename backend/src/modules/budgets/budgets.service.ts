import { pool } from "../../config/db";
import { randomUUID } from "crypto";
import { BudgetEntity } from "./entities/budget.entity";
import { CreateBudgetDto } from "./dto/create-budget.dto";

export const BudgetsService = {
    createBudgets: async (userId: string, dto: CreateBudgetDto): Promise<any> => {
        const query1 = `select id from budgets where user_id = ? and name = ?`
        const [check] = await pool.query<any[]>(query1, [userId, dto.name]);
        if (check.length > 0) {
            throw new Error("Ngân sách đã tồn tại");
        }
        const query2 = `insert into budgets (user_id, name, category_id, budget_month, amount, amount_in_default_currency, alert_threshold_percent)
        values (?, ?, ?, ?, ?, ?, ?)`;
        const result = await pool.query<any>(query2, [userId, dto.name, dto.categoryId, dto.budgetMonth, dto.amount, dto.amountInDefaultCurrency, dto.alertThresholdPercent]);
        return result;
    },

    listBudgets: async (userId: string): Promise<any[]> => {
        const query = `select id, name, amount, currency, budget_month, amount_in_default_currency, alert_threshold_percent
        from budgets where user_id = ? AND deleted_at IS NULL`
        const [result] = await pool.query<any[]>(query, [userId]);
        return result;
    },

    getBudgetById: async (userId: string, id: string): Promise<any> => {
        const query = `select id, name, amount, currency, budget_month, amount_in_default_currency, alert_threshold_percent
        from budgets where user_id = ? and id = ? AND deleted_at IS NULL`
        const [result] = await pool.query<any[]>(query, [userId, id]);
        if (result.length === 0)
            throw new Error("Không tìm thấy ngân sách");
        return result[0];
    },

    updateBudget: async (userId: string, id: string, dto: CreateBudgetDto): Promise<any> => {
        const query = `update budgets
        set name = ? 
        , amount = ? 
        , category_id = ? 
        , amount_in_default_currency = ?
        , alert_threshold_percent = ? 
        , is_active = ?
        where user_id = ?
        and id = ?`;
        const [result] = await pool.query<any>(query, [dto.name, dto.amount, dto.categoryId, dto.amountInDefaultCurrency, dto.alertThresholdPercent, dto.isActive, userId, id]);
        if (result.affectedRows === 0)
            throw new Error("Không tìm thấy ngân sách");
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
        const query = `update budgets
        set deleted_at = NOW()
        where user_id = ?
        and id = ?`;
        const [result] = await pool.query<any>(query, [userId, id]);
        if (result.affectedRows === 0)
            throw new Error("Không tìm thấy ngân sách");
        return {
            success: true,
            message: "Xóa ngân sách thành công"
        };
    },
}