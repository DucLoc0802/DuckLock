import { pool } from "../../config/db";
import { CreateTransactionDto } from "./dto/create-transaction.dto";
import { randomUUID } from "crypto";

export const TransactionsService = {
  createTransaction: async (dto: CreateTransactionDto): Promise<any> => {
    // 1. Lấy user đầu tiên trong hệ thống để gán làm chủ sở hữu (tránh lỗi khóa ngoại khi chưa có Auth JWT middleware)
    const [users] = await pool.query<any[]>("SELECT id FROM users LIMIT 1");
    if (users.length === 0) {
      throw new Error("Không tìm thấy người dùng nào. Vui lòng đăng ký tài khoản trước!");
    }
    const userId = users[0].id;

    // 2. Tìm hoặc Tạo mới danh mục (Category) tương ứng để lấy category_id (tránh lỗi khóa ngoại fk_tx_categories)
    const categoryName = dto.category.trim();
    const [categories] = await pool.query<any[]>(
      "SELECT id FROM categories WHERE name = ? AND (user_id = ? OR user_id IS NULL) LIMIT 1",
      [categoryName, userId]
    );

    let categoryId: string;

    if (categories.length > 0) {
      categoryId = categories[0].id;
    } else {
      // Nếu danh mục chưa tồn tại, tự động tạo mới một danh mục mặc định
      categoryId = randomUUID();
      await pool.query(
        "INSERT INTO categories (id, user_id, name, icon, color, is_default) VALUES (?, ?, ?, ?, ?, ?)",
        [categoryId, userId, categoryName, "📝", "#9E9E9E", false]
      );
    }

    // 3. Chuẩn bị các giá trị chèn giao dịch
    const txId = randomUUID();
    const currency = "VND"; // Mặc định tiền tệ của giao dịch
    const amountInDefaultCurrency = dto.amount; // Mặc định tỉ giá 1:1 khi chưa có API tỉ giá

    // 4. INSERT giao dịch mới vào MySQL
    await pool.query(
      `INSERT INTO transactions 
       (id, user_id, category_id, proof_image_id, amount, currency, amount_in_default_currency, type, transaction_date, description) 
       VALUES (?, ?, ?, NULL, ?, ?, ?, ?, ?, ?)` ,
      [
        txId,
        userId,
        categoryId,
        dto.amount,
        currency,
        amountInDefaultCurrency,
        dto.type.toUpperCase(), // Khớp với ENUM('EXPENSE', 'INCOME') trong MySQL
        dto.transactionDate,
        dto.description || ""
      ]
    );

    // 5. Trả về đối tượng giao dịch đã tạo
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
      type: dto.type.toLowerCase()
    };
  },

  getTransactionById: async (id: string): Promise<any> => {
    const query = `SELECT 
      t.id, t.amount, t.currency, t.type, t.transaction_date, t.description,
      c.id AS category_id, c.name AS category_name, c.icon AS category_icon, c.color AS category_color
    FROM transactions t
    LEFT JOIN categories c ON t.category_id = c.id
    WHERE t.id = ? AND t.deleted_at IS NULL
    LIMIT 1`
    const [rows] = await pool.query<any[]>(query, [id]);
    const tx = rows[0];
    if (!tx) {
      throw new Error("Không tìm thấy giao dịch");
    }

    return {
      id: tx.id,
      amount: tx.amount,
      currency: tx.currency,
      type: tx.type.toLowerCase(),
      transaction_date: tx.transaction_date,
      description: tx.description,
      category: tx.category_id ? {
        id: tx.category_id,
        name: tx.category_name,
        icon: tx.category_icon,
        color: tx.category_color
      } : null
    };
  },

  deleteTransaction: async (id: string): Promise<any> => {
    const query = `UPDATE transactions 
    SET deleted_at = NOW() 
    WHERE id = ? 
    AND deleted_at IS NULL 
    LIMIT 1`;

    const [result] = await pool.query<any>(query, [id]);
    if (result.affectedRows === 0) {
      throw new Error("Không tìm thấy giao dịch");
    }

    return {
      success: true,
      message: "Xóa giao dịch thành công"
    }
  },
  updateTransaction: async (id: string, dto: any): Promise<any> => {
    // 1. Kiểm tra xem giao dịch có tồn tại hay không
    const [txs] = await pool.query<any[]>("SELECT user_id FROM transactions WHERE id = ? AND deleted_at IS NULL", [id]);
    if (txs.length === 0) {
      throw new Error("Không tìm thấy giao dịch");
    }
    const userId = txs[0].user_id;

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

    // 3. Thực thi câu lệnh SQL UPDATE với COALESCE
    const query = `UPDATE transactions
    SET
      amount = COALESCE(?, amount),
      amount_in_default_currency = COALESCE(?, amount_in_default_currency),
      category_id = COALESCE(?, category_id),
      transaction_date = COALESCE(?, transaction_date),
      description = COALESCE(?, description),
      type = COALESCE(?, type),
      updated_at = NOW()
    WHERE id = ?
    AND deleted_at IS NULL
    LIMIT 1;`;

    // Chuyển toàn bộ các giá trị undefined thành null để tránh lỗi mysql2
    const params = [
      dto.amount !== undefined ? dto.amount : null,
      dto.amount !== undefined ? dto.amount : null,
      categoryId,
      dto.transactionDate !== undefined ? dto.transactionDate : null,
      dto.description !== undefined ? dto.description : null,
      dto.type !== undefined ? dto.type.toUpperCase() : null,
      id
    ];

    const [result] = await pool.query<any>(query, params);
    if (result.affectedRows === 0) {
      throw new Error("Không tìm thấy giao dịch");
    }

    // 4. Trả về đối tượng giao dịch đầy đủ sau khi đã cập nhật
    return TransactionsService.getTransactionById(id);
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