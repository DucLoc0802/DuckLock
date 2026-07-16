import { pool } from "../../config/db";
import { AppError } from "../../utils/app-errors";
import { CreateRecurringTransactionDto } from "./dto/create-recurring-transaction.dto";
import { UpdateRecurringTransactionDto } from "./dto/update-recurring-transaction.dto";

export const RecurringTransactionsService = {
    createRecurringTransaction: async (userId: string, dto: CreateRecurringTransactionDto): Promise<any> => {
        const checkWalletQuery = `select id from wallets where id = ? AND user_id = ? AND deleted_at IS NULL`
        const [checkWallet] = await pool.query<any[]>(checkWalletQuery, [dto.walletId, userId]);
        if (checkWallet.length === 0)
            throw new AppError(404, "Không tìm thấy ví");

        const checkNameAndTypeQuery = `select id from recurring_transactions where user_id = ? AND name = ? AND type = ? AND deleted_at IS NULL`;
        const [checkNameAndType] = await pool.query<any[]>(checkNameAndTypeQuery, [userId, dto.name, dto.type]);
        if (checkNameAndType.length > 0)
            throw new AppError(409, "Giao dịch định kỳ đã tồn tại");

        const query = `INSERT INTO recurring_transactions 
            (user_id, wallet_id, category_id, name, amount, type, description, frequency, day_of_period, start_date, end_date, next_execution_date)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
        const [result] = await pool.query<any>(query, [
            userId,
            dto.walletId,
            dto.categoryId || null,
            dto.name,
            dto.amount,
            dto.type,
            dto.description || null,
            dto.frequency,
            dto.dayOfPeriod,
            dto.startDate,
            dto.endDate || null,
            dto.nextExecutionDate,
        ]);
        return {
            id: result.insertId,
            userId,
            ...dto,
        };
    },

    listRecurringTransactions: async (userId: string): Promise<any[]> => {
        const query = `SELECT id, wallet_id, category_id, name, amount, type, description,
            frequency, day_of_period, start_date, end_date, 
            last_executed_at, next_execution_date, is_active, created_at
            FROM recurring_transactions 
            WHERE user_id = ? AND deleted_at IS NULL
            ORDER BY next_execution_date ASC`;
        const [result] = await pool.query<any[]>(query, [userId]);
        return result;
    },

    getRecurringTransactionById: async (userId: string, id: string): Promise<any> => {
        const query = `SELECT id, wallet_id, category_id, name, amount, type, description,
            frequency, day_of_period, start_date, end_date, 
            last_executed_at, next_execution_date, is_active, created_at
            FROM recurring_transactions 
            WHERE user_id = ? AND id = ? AND deleted_at IS NULL`;
        const [result] = await pool.query<any[]>(query, [userId, id]);
        if (result.length === 0)
            throw new Error("Không tìm thấy giao dịch định kỳ");
        return result[0];
    },

    updateRecurringTransaction: async (userId: string, id: string, dto: UpdateRecurringTransactionDto): Promise<any> => {
        const query = `UPDATE recurring_transactions
            SET name = ?
            , amount = ?
            , type = ?
            , wallet_id = ?
            , category_id = ?
            , description = ?
            , frequency = ?
            , day_of_period = ?
            , start_date = ?
            , end_date = ?
            , next_execution_date = ?
            , is_active = ?
            WHERE user_id = ? AND id = ? AND deleted_at IS NULL`;
        const [result] = await pool.query<any>(query, [
            dto.name,
            dto.amount,
            dto.type,
            dto.walletId,
            dto.categoryId || null,
            dto.description || null,
            dto.frequency,
            dto.dayOfPeriod,
            dto.startDate,
            dto.endDate || null,
            dto.nextExecutionDate,
            dto.isActive ?? true,
            userId,
            id,
        ]);
        if (result.affectedRows === 0)
            throw new Error("Không tìm thấy giao dịch định kỳ");
        return { id, userId, ...dto };
    },

    deleteRecurringTransaction: async (userId: string, id: string): Promise<any> => {
        const query = `UPDATE recurring_transactions
            SET deleted_at = NOW()
            WHERE user_id = ? AND id = ? AND deleted_at IS NULL`;
        const [result] = await pool.query<any>(query, [userId, id]);
        if (result.affectedRows === 0)
            throw new Error("Không tìm thấy giao dịch định kỳ");
        return {
            success: true,
            message: "Xóa giao dịch định kỳ thành công",
        };
    },
    // Lấy danh sách giao dịch định kỳ đến hạn hôm nay (hoặc đã quá hạn)
    getDueRecurringTransactions: async (userId: string): Promise<any[]> => {
        const query = `SELECT id, wallet_id, category_id, name, amount, type, description,
        frequency, day_of_period, next_execution_date
        FROM recurring_transactions 
        WHERE user_id = ? 
        AND next_execution_date <= CURDATE()
        AND is_active = TRUE
        AND deleted_at IS NULL`;
        const [result] = await pool.query<any[]>(query, [userId]);
        return result;
    },
    // Xác nhận thanh toán: tạo giao dịch thật + cập nhật ngày tiếp theo
    confirmRecurringTransaction: async (userId: string, recurringId: string): Promise<any> => {
        // 1. Lấy thông tin giao dịch định kỳ
        const [rows] = await pool.query<any[]>(
            `SELECT * FROM recurring_transactions WHERE id = ? AND user_id = ? AND deleted_at IS NULL`,
            [recurringId, userId]
        );
        if (rows.length === 0) throw new Error("Không tìm thấy giao dịch định kỳ");
        const recurring = rows[0];

        // 2. Tạo giao dịch thật vào bảng transactions
        await pool.query(
            `INSERT INTO transactions (user_id, wallet_id, category_id, amount, type, description, transaction_date, amount_in_default_currency)
         VALUES (?, ?, ?, ?, ?, ?, CURDATE(), ?)`,
            [userId, recurring.wallet_id, recurring.category_id, recurring.amount, recurring.type, recurring.description, recurring.amount]
        );

        // 3. Cập nhật số dư ví
        if (recurring.type === 'EXPENSE') {
            await pool.query(`UPDATE wallets SET balance = balance - ? WHERE id = ?`, [recurring.amount, recurring.wallet_id]);
        } else {
            await pool.query(`UPDATE wallets SET balance = balance + ? WHERE id = ?`, [recurring.amount, recurring.wallet_id]);
        }

        // 4. Tính next_execution_date tiếp theo dựa theo frequency
        let nextDateSQL = '';
        switch (recurring.frequency) {
            case 'DAILY': nextDateSQL = `DATE_ADD(next_execution_date, INTERVAL 1 DAY)`; break;
            case 'WEEKLY': nextDateSQL = `DATE_ADD(next_execution_date, INTERVAL 1 WEEK)`; break;
            case 'MONTHLY': nextDateSQL = `DATE_ADD(next_execution_date, INTERVAL 1 MONTH)`; break;
            case 'YEARLY': nextDateSQL = `DATE_ADD(next_execution_date, INTERVAL 1 YEAR)`; break;
        }

        await pool.query(
            `UPDATE recurring_transactions 
         SET last_executed_at = CURDATE(), next_execution_date = ${nextDateSQL}
         WHERE id = ?`,
            [recurringId]
        );

        return { success: true, message: "Xác nhận thanh toán thành công" };
    },

};