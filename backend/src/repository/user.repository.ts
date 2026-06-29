import { UserEntity } from "../types/auth.types"
import { Pool } from 'pg';

const db: Pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'my_auth_db',
    password: 'mypassword123',
    port: 5432,
});

export const UserRepository = {
    FindByUserName: async (username: string): Promise<UserEntity | null> => {
        const sql = `SELECT * FROM USERS WHERE USERNAME = $1;`
        const dbResult = await db.query(sql, [username]);
        if (dbResult.rows.length === 0) {
            return null;
        }

        const rawUser = dbResult.rows[0];

        return {
            id: rawUser.id,
            username: rawUser.username,
            password: rawUser.password,
            status: rawUser.status
        };
    }
}