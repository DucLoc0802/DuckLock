# Tài Liệu Hướng Dẫn Backend - Tự Thực Hành API MySQL

Tài liệu này tổng hợp cấu trúc API hiện tại và hướng dẫn bạn tự viết thêm phần API còn thiếu ở phía Backend (không làm ảnh hưởng đến mã nguồn hiện tại).

---

## 🔑 1. Cơ Chế Xác Thực JWT Trên Backend

Backend sử dụng thư viện `jsonwebtoken` để tạo chữ ký bảo mật. Khóa bí mật được đọc từ file `.env`:
*   `JWT_ACCESS_SECRET`: Dùng để ký số Access Token có thời hạn ngắn.
*   `JWT_REFRESH_SECRET`: Dùng để ký số Refresh Token có thời hạn dài.

Mã hóa mật khẩu sử dụng `bcrypt` với 10 vòng muối (`saltRounds = 10`) để băm mật khẩu 1 chiều trước khi lưu vào bảng `users`.

---

## 💸 2. Hướng Dẫn Tự Viết API Lấy Danh Sách Giao Dịch (`GET /api/transactions`)

Hiện tại Backend mới chỉ có các API đơn lẻ (Tạo, Xem chi tiết, Xóa, Cập nhật). Để kết nối thành công với Frontend, bạn cần tự code thêm API lấy danh sách giao dịch theo các bước sau:

### Bước A: Thêm hàm xử lý Database trong Service
Mở file [transactions.service.ts](file:///c:/Users/HP/Desktop/React%20native/DuckLock/backend/src/modules/transactions/transactions.service.ts) và thêm phương thức `listTransactions` để truy vấn danh sách:

```typescript
// Thêm vào trong đối tượng TransactionsService:
listTransactions: async (userId: string): Promise<any[]> => {
  // Lấy các giao dịch chưa bị xóa mềm của người dùng hiện tại
  // JOIN với bảng categories để lấy thông tin tên, màu sắc, icon của danh mục
  const query = `
    SELECT 
      t.id, 
      t.amount, 
      t.type, 
      t.transaction_date, 
      t.description, 
      t.created_at,
      c.id AS category_id,
      c.name AS category_name,
      c.icon AS category_icon,
      c.color AS category_color
    FROM transactions t
    LEFT JOIN categories c ON t.category_id = c.id
    WHERE t.user_id = ? 
    AND t.deleted_at IS NULL
    ORDER BY t.transaction_date DESC;
  `;
  
  const [rows] = await pool.query<any[]>(query, [userId]);
  return rows;
}
```

### Bước B: Viết Hàm Xử Lý Trong Controller
Mở file [transactions.controller.ts](file:///c:/Users/HP/Desktop/React%20native/DuckLock/backend/src/modules/transactions/transactions.controller.ts) và viết hàm điều phối:

```typescript
// Thêm vào trong đối tượng TransactionsController:
listTransactions: async (req: Request, res: Response) => {
  try {
    // req.user sẽ do Auth Middleware giải mã từ Token JWT và gán vào
    const userId = (req as any).user?.userId || "user-id-mac-dinh"; 
    
    const transactions = await TransactionsService.listTransactions(userId);
    
    return res.status(200).json({
      success: true,
      message: "Lấy danh sách giao dịch thành công",
      data: transactions
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
}
```

### Bước C: Đăng Ký Route Trong Module
Mở file [transactions.module.ts](file:///c:/Users/HP/Desktop/React%20native/DuckLock/backend/src/modules/transactions/transactions.module.ts) và liên kết Router:

```typescript
// Định nghĩa Route GET lấy danh sách:
// Nếu bạn đã viết Auth Middleware, hãy chèn vào giữa để bảo mật route này
router.get("/", requireAuth, TransactionsController.listTransactions);
```
*(Nếu chưa viết middleware `requireAuth`, bạn có thể tạm bỏ qua nó để gọi API công khai trước).*

---

## 🎯 Thứ Tự Gọi API Từ Frontend

Khi bạn thực hiện Đăng nhập và hiển thị trang chủ, luồng API sẽ chạy như sau:
1.  Frontend gọi `POST /api/auth/login` $\rightarrow$ Backend kiểm tra Database, trả về `access_token`.
2.  Frontend lưu `access_token` và tự động gửi request `GET /api/transactions` kèm Header `Authorization: Bearer <token>`.
3.  Backend nhận request, giải mã token bằng `JWT_ACCESS_SECRET` để tìm ra `userId`, sau đó gọi SQL truy vấn toàn bộ giao dịch của `userId` đó và trả về cho Frontend hiển thị.
