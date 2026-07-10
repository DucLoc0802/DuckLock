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
}