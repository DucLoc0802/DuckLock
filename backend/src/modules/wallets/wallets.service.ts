import { pool } from "../../config/db";
import { randomUUID } from "crypto";
import { WalletEntity } from "./entities/wallet.entity";
import { AppError } from "../../utils/app-errors";

export const WalletsService = {
    getAllWallets: async (userId: string): Promise<WalletEntity[]> => {
        const query = `select id, name, type, balance, currency, interest_rate_percent, created_at
        from wallets where user_id = ? AND deleted_at IS NULL`
        const [result] = await pool.query<any[]>(query, [userId]);
        return result;
    },

    getWalletById: async (userId: string, id: string): Promise<any> => {
        const query = `select id, name, type, balance, currency, interest_rate_percent, created_at
        from wallets where user_id = ? and id = ? AND deleted_at IS NULL`
        const [result] = await pool.query<any[]>(query, [userId, id]);
        if (result.length === 0)
            throw new AppError(404, "Không tìm thấy ví");
        return result[0];
    },

    createWallet: async (
        userId: string,
        name: string,
        type: string | 'BANK' | 'SAVING',
        balance: number,
        interestRatePercent: number | null
    ): Promise<any> => {
        const checkNameAndTypeQuery = `select name, type from wallets where user_id = ? and name = ? and type = ?`;
        const [result] = await pool.query<any>(checkNameAndTypeQuery, [userId, name, type]);
        if (result.length > 0) throw new AppError(409, "Tên ví đã tồn tại");

        const id = randomUUID();
        const query = `insert into wallets (id, user_id, name, type, balance, currency, interest_rate_percent, is_default, sort_order)
        values (?, ?, ?, ?, ?, 'VND', ?, false, 0)`;
        await pool.query(query, [id, userId, name, type, balance, interestRatePercent]);
        return {
            id,
            user_id: userId,
            name,
            type,
            balance,
            currency: 'VND',
            interest_rate_percent: interestRatePercent,
            created_at: new Date()
        };
    },

    updateWallet: async (userId: string, id: string, type: string | 'BANK' | 'SAVING', name: string, balance: number, interestRatePercent: number | null): Promise<any> => {
        const query = `update wallets
        set name = ? 
        , balance = ?
        , interest_rate_percent = ?
        where user_id = ?
        and id = ?
        and type = ?`;
        const [result] = await pool.query<any>(query, [name, balance, interestRatePercent, userId, id, type]);
        if (result.affectedRows === 0)
            throw new AppError(404, "Không tìm thấy ví");
        return {
            id,
            userId,
            name,
            balance,
            interest_rate_percent: interestRatePercent
        }
    },
    deleteWallet: async (userId: string, id: string): Promise<any> => {
        const query = `update wallets
        set deleted_at = NOW()
        where user_id = ?
        and id = ?`;
        const [result] = await pool.query<any>(query, [userId, id]);
        if (result.affectedRows === 0)
            throw new AppError(404, "Không tìm thấy ví");
        return {
            success: true,
            message: "Xóa ví thành công"
        };
    },
    calculateInterest: async (userId: string): Promise<any[]> => {
        // Lấy tất cả ví là BANK có lãi
        const query1 = `SELECT * FROM wallets WHERE user_id = ? AND type = 'SAVING' AND interest_rate_percent > 0 AND deleted_at IS NULL`;
        const [wallets] = await pool.query<any[]>(query1, [userId]);

        const interestDetails = [];

        for (const wallet of wallets) {
            // Tính lãi đơn: A = P × (1 + rt)
            // r = lãi suất theo thập phân (1% → 0.01)
            const rate = wallet.interest_rate_percent / 100;
            const dailyInterest = wallet.balance * rate / 365;

            interestDetails.push({
                walletId: wallet.id,
                walletName: wallet.name,
                balance: wallet.balance,
                interestRatePercent: wallet.interest_rate_percent,
                dailyInterest: dailyInterest,
                currency: wallet.currency
            });
        }

        return interestDetails;
    },

    collectInterest: async (userId: string, walletId: string, period: 'MONTHLY' | 'YEARLY'): Promise<any> => {
        // 1. Lấy thông tin ví tiết kiệm
        const query1 = `SELECT * FROM wallets WHERE id = ? AND user_id = ? AND type = 'SAVING' AND deleted_at IS NULL`;
        const [wallets] = await pool.query<any[]>(query1, [walletId, userId]);
        if (wallets.length === 0) throw new AppError(404, "Không tìm thấy ví tiết kiệm");
        const wallet = wallets[0];

        if (!wallet.interest_rate_percent || wallet.interest_rate_percent <= 0) {
            throw new AppError(400, "Ví này không có lãi suất");
        }

        // 2. Tính tiền lãi dựa theo chu kỳ
        const rate = wallet.interest_rate_percent / 100;
        let interest = 0;
        if (period === 'MONTHLY') {
            interest = wallet.balance * rate / 12; // Lãi 1 tháng
        } else {
            interest = wallet.balance * rate;       // Lãi 1 năm
        }
        interest = Math.round(interest); // Làm tròn cho VND
        const query2 = `UPDATE wallets SET balance = balance + ? WHERE id = ?`;
        // 3. Cộng tiền lãi vào số dư ví
        await pool.query(query2, [interest, walletId]);

        // 4. Tạo giao dịch INCOME loại "Tiền lãi tiết kiệm"
        const query3 = `INSERT INTO transactions (user_id, wallet_id, amount, type, description, transaction_date, amount_in_default_currency)
         VALUES (?, ?, ?, 'INCOME', ?, CURDATE(), ?)`;
        await pool.query(query3, [userId, walletId, interest, `Tiền lãi tiết kiệm ${period === 'MONTHLY' ? 'tháng' : 'năm'} - ${wallet.name}`, interest]);

        return {
            success: true,
            walletId,
            walletName: wallet.name,
            interestAmount: interest,
            newBalance: wallet.balance + interest,
            period,
            message: `Nhận lãi ${interest.toLocaleString('vi-VN')}đ thành công`,
        };
    },

};