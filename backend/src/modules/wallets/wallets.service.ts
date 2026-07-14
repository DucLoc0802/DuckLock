import { pool } from "../../config/db";
import { randomUUID } from "crypto";
import { WalletEntity } from "./entities/wallet.entity";

export const WalletsService = {
    getAllWallets: async (userId: string): Promise<WalletEntity[]> => {
        const query = `select id, name, type, balance, currency, interest_rate_percent
        from wallets where user_id = ? AND deleted_at IS NULL`
        const [result] = await pool.query<any[]>(query, [userId]);
        return result;
    },

    getWalletById: async (userId: string, id: string): Promise<any> => {
        const query = `select id, name, type, balance, currency, interest_rate_percent
        from wallets where user_id = ? and id = ? AND deleted_at IS NULL`
        const [result] = await pool.query<any[]>(query, [userId, id]);
        if (result.length === 0)
            throw new Error("Không tìm thấy ví");
        return result[0];
    },

    createWallet: async (
        userId: string,
        name: string,
        type: string | 'BANK' | 'DEBT',
        balance: number,
        interestRatePercent: number | null
    ): Promise<any> => {
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
            interest_rate_percent: interestRatePercent
        };
    },
    updateWallet: async (userId: string, id: string, type: string | 'BANK' | 'DEBT', name: string, balance: number): Promise<any> => {
        const query = `update wallets
        set name = ? and balance = ?
        where userId = ?
        and id = ?
        and type = ?`;
        const [result] = await pool.query<any>(query, [name, balance, userId, id, type]);
        if (result.affectedRows === 0)
            throw new Error("Không tìm thấy ví");
        return {
            id,
            userId,
            name,
            balance
        }
    },
    deleteWallet: async (userId: string, id: string): Promise<any> => {
        const query = `update wallets
        set deleted_at = NOW()
        where userId = ?
        and id = ?`;
        const [result] = await pool.query<any>(query, [userId, id]);
        if (result.affectedRows === 0)
            throw new Error("Không tìm thấy ví");
        return {
            success: true,
            message: "Xóa giao dịch thành công"
        };
    },
}