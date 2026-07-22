import { pool } from "../../config/db";
import { randomUUID } from "crypto";

export const ProofImagesService = {
    // Lưu thông tin ảnh vào MySQL
    saveImageInfo: async (userId: string, imageUrl: string): Promise<any> => {
        const id = randomUUID();
        const query = `
      INSERT INTO proof_images (id, user_id, image_url, status)
      VALUES (?, ?, ?, 'PENDING')
    `;
        await pool.query(query, [id, userId, imageUrl]);

        return {
            id,
            image_url: imageUrl,
            status: 'PENDING',
            captured_at: new Date()
        };
    }
};
