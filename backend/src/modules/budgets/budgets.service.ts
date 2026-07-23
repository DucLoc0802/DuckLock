import { pool } from "../../config/db";
import { randomUUID } from "crypto";
import { BudgetEntity } from "./entities/budget.entity";
import { CreateBudgetDto } from "./dto/create-budget.dto";
import { AppError } from "../../utils/app-errors";

async function ensureCategoryExists(userId: string, categoryId: string | null | undefined): Promise<string | null | undefined> {
    if (!categoryId) return categoryId;
    
    const [catCheck] = await pool.query<any[]>(`select id from categories where id = ?`, [categoryId]);
    if (catCheck.length > 0) return categoryId;
    
    // Tên danh mục mặc định tương ứng với ID của client
    let catName = "Khác";
    let catIcon = "📝";
    let catColor = "#9E9E9E";
    
    if (categoryId === 'food') { catName = "Ăn uống"; catIcon = "🍔"; catColor = "#FF6B6B"; }
    else if (categoryId === 'transport') { catName = "Di chuyển"; catIcon = "🚗"; catColor = "#4DABF7"; }
    else if (categoryId === 'shopping') { catName = "Mua sắm"; catIcon = "🛍️"; catColor = "#FCC419"; }
    else if (categoryId === 'entertainment') { catName = "Giải trí"; catIcon = "🎬"; catColor = "#AE3EC9"; }
    else if (categoryId === 'bills') { catName = "Hóa đơn"; catIcon = "🧾"; catColor = "#F06595"; }
    else if (categoryId === 'salary') { catName = "Lương"; catIcon = "💵"; catColor = "#37B24D"; }
    
    const insertCatQuery = `insert into categories (id, user_id, name, icon, color, is_default, created_at, updated_at)
    values (?, ?, ?, ?, ?, false, NOW(), NOW())`;
    
    try {
        await pool.query(insertCatQuery, [categoryId, userId, catName, catIcon, catColor]);
        return categoryId;
    } catch (catErr: any) {
        if (catErr.code === 'ER_DUP_ENTRY') {
            const [existingCat] = await pool.query<any[]>(
                `select id from categories where name = ? and (user_id = ? or user_id is null) limit 1`, 
                [catName, userId]
            );
            if (existingCat.length > 0) {
                return existingCat[0].id;
            }
        }
        throw catErr;
    }
}

export const BudgetsService = {
    createBudgets: async (userId: string, dto: CreateBudgetDto): Promise<any> => {
        const checkNameQuery = `select id from budgets where user_id = ? and name = ? and deleted_at is null`
        const [check] = await pool.query<any[]>(checkNameQuery, [userId, dto.name]);
        if (check.length > 0) {
            throw new AppError(409, "Tên ngân sách đã tồn tại");
        }
        
        // Đảm bảo danh mục tồn tại trước khi insert
        const actualCategoryId = await ensureCategoryExists(userId, dto.categoryId);
        
        const id = randomUUID();
        const createBudgetQuery = `insert into budgets (id, user_id, name, category_id, budget_month, amount, amount_in_default_currency, alert_threshold_percent)
        values (?, ?, ?, ?, ?, ?, ?, ?)`;
        await pool.query<any>(createBudgetQuery, [id, userId, dto.name, actualCategoryId, dto.budgetMonth, dto.amount, dto.amountInDefaultCurrency, dto.alertThresholdPercent]);
        
        return {
            id,
            userId,
            name: dto.name,
            categoryId: actualCategoryId,
            budgetMonth: dto.budgetMonth,
            amount: dto.amount,
            amountInDefaultCurrency: dto.amountInDefaultCurrency,
            alertThresholdPercent: dto.alertThresholdPercent,
            isActive: true
        };
    },

    listBudgets: async (userId: string): Promise<any[]> => {
        const listBudgetQuery = `select id, name, amount, currency, budget_month, amount_in_default_currency, alert_threshold_percent, category_id, created_at, is_active
        from budgets where user_id = ? AND deleted_at IS NULL`
        const [result] = await pool.query<any[]>(listBudgetQuery, [userId]);
        return result;
    },

    getBudgetById: async (userId: string, id: string): Promise<any> => {
        const getBudgetQuery = `select id, name, amount, currency, budget_month, amount_in_default_currency, alert_threshold_percent, category_id, created_at, is_active
        from budgets where user_id = ? and id = ? AND deleted_at IS NULL`
        const [result] = await pool.query<any[]>(getBudgetQuery, [userId, id]);
        if (result.length === 0)
            throw new AppError(404, "Không tìm thấy ngân sách");
        return result[0];
    },

    updateBudget: async (userId: string, id: string, dto: CreateBudgetDto): Promise<any> => {
        // Đảm bảo danh mục tồn tại trước khi update
        const actualCategoryId = await ensureCategoryExists(userId, dto.categoryId);

        const updateBudgetQuery = `update budgets
        set name = ? 
        , amount = ? 
        , category_id = ? 
        , amount_in_default_currency = ?
        , alert_threshold_percent = ? 
        , is_active = ?
        where user_id = ?
        and id = ?`;
        const [result] = await pool.query<any>(updateBudgetQuery, [dto.name, dto.amount, actualCategoryId, dto.amountInDefaultCurrency, dto.alertThresholdPercent, dto.isActive, userId, id]);
        if (result.affectedRows === 0)
            throw new AppError(404, "Không tìm thấy ngân sách");
        return {
            id,
            userId,
            name: dto.name,
            amount: dto.amount,
            categoryId: actualCategoryId,
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