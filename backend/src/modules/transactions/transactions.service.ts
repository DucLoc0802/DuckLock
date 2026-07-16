import { pool } from "../../config/db";
import { CreateTransactionDto } from "./dto/create-transaction.dto";
import { randomUUID } from "crypto";

export const TransactionsService = {
  createTransaction: async (userId: string, dto: CreateTransactionDto): Promise<any> => {
    // Tìm hoặc Tạo mới danh mục (Category) tương ứng để lấy category_id (tránh lỗi khóa ngoại fk_tx_categories)
    const categoryName = dto.category.trim();
    const query1 = `SELECT id FROM categories WHERE name = ? AND (user_id = ? OR user_id IS NULL) LIMIT 1`
    const [categories] = await pool.query<any[]>(query1, [categoryName, userId]);

    let categoryId: string;

    if (categories.length > 0) {
      categoryId = categories[0].id;
    } else {
      // Nếu danh mục chưa tồn tại, tự động tạo mới một danh mục mặc định
      categoryId = randomUUID();
      const query2 = `INSERT INTO categories (id, user_id, name, icon, color, is_default) VALUES (?, ?, ?, ?, ?, ?)`
      await pool.query(query2, [categoryId, userId, categoryName, "📝", "#9E9E9E", false]);
    }

    // Chuẩn bị các giá trị chèn giao dịch
    const txId = randomUUID();
    const currency = "VND"; // Mặc định tiền tệ của giao dịch
    const amountInDefaultCurrency = dto.amount; // Mặc định tỉ giá 1:1 khi chưa có API tỉ giá

    const query3 = `INSERT INTO transactions 
       (id, user_id, category_id, wallet_id, proof_image_id, amount, currency, amount_in_default_currency, type, transaction_date, description) 
       VALUES (?, ?, ?, ?, NULL, ?, ?, ?, ?, ?, ?)`
    // INSERT giao dịch mới vào MySQL
    await pool.query(
      query3,
      [
        txId,
        userId,
        categoryId,
        dto.walletId,
        dto.proofImage,
        dto.amount,
        currency,
        amountInDefaultCurrency,
        dto.type.toUpperCase(), // Khớp với ENUM('EXPENSE', 'INCOME') trong MySQL
        dto.transactionDate,
        dto.description || ""
      ]
    );

    if (dto.type === "expense") {
      const query4 = `UPDATE wallets 
    SET balance = balance - ?
    WHERE user_id = ?
    AND id = ?`
      await pool.query(query4, [dto.amount, userId, dto.walletId]);
    }

    else {
      const query4 = `UPDATE wallets 
    SET balance = balance + ?
    WHERE user_id = ?
    AND id = ?`
      await pool.query(query4, [dto.amount, userId, dto.walletId]);
    }

    // Trả về đối tượng giao dịch đã tạo
    return {
      id: txId,
      amount: dto.amount,
      currency,
      category: {
        id: categoryId,
        name: categoryName
      },
      transactionDate: dto.transactionDate,
      description: dto.description || "",
      type: dto.type.toLowerCase(),
      walletId: dto.walletId
    };
  },

  getTransactionById: async (id: string, userId: string): Promise<any> => {
    const query = `SELECT 
      t.id, t.amount, t.currency, t.type, t.transaction_date, t.description,
      c.id AS category_id, c.name AS category_name, c.icon AS category_icon, c.color AS category_color,
      pi.image_url AS image_url, t.wallet_id
    FROM transactions t
    LEFT JOIN categories c ON t.category_id = c.id
    LEFT JOIN proof_images pi ON t.proof_image_id = pi.id
    WHERE t.id = ? AND t.user_id = ? AND t.deleted_at IS NULL
    LIMIT 1`;

    const [rows] = await pool.query<any[]>(query, [id, userId]);

    const tx = rows[0];
    if (!tx) {
      throw new Error("Không tìm thấy giao dịch");
    }

    return {
      id: tx.id,
      amount: Number(tx.amount),
      currency: tx.currency,
      type: tx.type.toLowerCase(),
      transactionDate: tx.transaction_date,
      description: tx.description,
      imageUri: tx.image_url || null, // Ánh xạ cột image_url thành imageUri
      walletId: tx.wallet_id,
      category: tx.category_id ? {
        id: tx.category_id,
        name: tx.category_name,
        icon: tx.category_icon,
        color: tx.category_color
      } : null
    };

  },

  deleteTransaction: async (id: string, userId: string): Promise<any> => {
    // Sửa câu SQL để kiểm tra user_id bảo mật
    const query1 = `UPDATE transactions 
    SET deleted_at = NOW() 
    WHERE id = ? AND user_id = ?
    AND deleted_at IS NULL 
    LIMIT 1`;

    const [result] = await pool.query<any>(query1, [id, userId]);
    if (result.affectedRows === 0) {
      throw new Error("Không tìm thấy giao dịch");
    }

    const query2 = `UPDATE wallets
    set balance = balance - ?
    where user_id = ?
    and id = ?
    and type = 'BANK`
    await pool.query(query2, [result.amount, userId, result.walletId]);
    return {
      success: true,
      message: "Xóa giao dịch thành công"
    };
  },

  updateTransaction: async (id: string, userId: string, dto: any): Promise<any> => {
    // 1. Kiểm tra xem giao dịch có đúng là của người dùng này không
    const [txs] = await pool.query<any[]>(
      "SELECT id FROM transactions WHERE id = ? AND user_id = ? AND deleted_at IS NULL",
      [id, userId]
    );
    if (txs.length === 0) {
      throw new Error("Không tìm thấy giao dịch");
    }

    // 2. Xử lý tìm hoặc tạo mới danh mục nếu người dùng thay đổi category
    let categoryId: string | null = null;
    if (dto.category !== undefined) {
      const categoryName = dto.category.trim();
      const [categories] = await pool.query<any[]>(
        "SELECT id FROM categories WHERE name = ? AND (user_id = ? OR user_id IS NULL) LIMIT 1",
        [categoryName, userId]
      );

      if (categories.length > 0) {
        categoryId = categories[0].id;
      } else {
        categoryId = randomUUID();
        await pool.query(
          "INSERT INTO categories (id, user_id, name, icon, color, is_default) VALUES (?, ?, ?, ?, ?, ?)",
          [categoryId, userId, categoryName, "📝", "#9E9E9E", false]
        );
      }
    }

    // 3. Thực thi câu lệnh SQL UPDATE lọc theo id và user_id
    const query = `UPDATE transactions
    SET
      amount = COALESCE(?, amount),
      amount_in_default_currency = COALESCE(?, amount_in_default_currency),
      category_id = COALESCE(?, category_id),
      transaction_date = COALESCE(?, transaction_date),
      description = COALESCE(?, description),
      type = COALESCE(?, type),
      updated_at = NOW()
    WHERE id = ? AND user_id = ?
    AND deleted_at IS NULL
    LIMIT 1;`;

    const params = [
      dto.amount !== undefined ? dto.amount : null,
      dto.amount !== undefined ? dto.amount : null,
      categoryId,
      dto.transactionDate !== undefined ? dto.transactionDate : null,
      dto.description !== undefined ? dto.description : null,
      dto.type !== undefined ? dto.type.toUpperCase() : null,
      id,
      userId
    ];

    const [result] = await pool.query<any>(query, params);
    if (result.affectedRows === 0) {
      throw new Error("Không tìm thấy giao dịch");
    }

    // 4. Trả về đối tượng giao dịch đầy đủ sau khi đã cập nhật
    return TransactionsService.getTransactionById(id, userId);
  },

  getTransaction: async (dto: any): Promise<any> => {
    const query = `SELECT 
      t.id, t.amount, t.currency, t.type, t.transaction_date, t.description,
      c.id AS category_id, c.name AS category_name, c.icon AS category_icon, c.color AS category_color
    FROM transactions t
    LEFT JOIN categories c ON t.category_id = c.id
    WHERE t.user_id = ? AND t.deleted_at IS NULL`
    const [result] = await pool.query<any>(query, [dto.user_id]);
    return result;
  }
}