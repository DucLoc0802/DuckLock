# Tài Liệu Hướng Dẫn Frontend - Kết Nối API

Tài liệu này hướng dẫn cách thức hoạt động của React Native Frontend (Expo) khi kết nối với Backend MySQL thông qua các API thực tế.

---

## 📌 Các Tính Năng Đã Đấu Nối API Thật

### 🔑 1. Xác thực (Authentication)
*   **Đăng ký (`POST /api/auth/register`)**:
    *   *Mục đích*: Tạo người dùng mới trong database MySQL.
    *   *Cách hoạt động*: Gửi `name`, `email`, `password` từ màn hình đăng ký lên backend. Nhận về `access_token` để tự động đăng nhập người dùng.
*   **Đăng nhập (`POST /api/auth/login`)**:
    *   *Mục đích*: Xác minh tài khoản và cấp quyền hoạt động.
    *   *Cách hoạt động*: Gửi `email`, `password` lên backend. Nếu thành công, backend cấp một chuỗi JWT `access_token` làm chìa khóa bảo mật.

### 💸 2. Quản lý giao dịch (Transactions)
*   **Lấy danh sách giao dịch (`GET /api/transactions`)**:
    *   *Mục đích*: Tải toàn bộ giao dịch của người dùng đã đăng nhập để hiển thị trên màn hình trang chủ.
    *   *Cách hoạt động*: Đính kèm token xác thực vào Header, backend truy vấn database MySQL trả về mảng giao dịch và hiển thị dạng danh sách sắp xếp theo ngày gần nhất.
*   **Tạo giao dịch (`POST /api/transactions`)**:
    *   *Mục đích*: Ghi nhận chi tiêu hoặc thu nhập mới của người dùng vào bảng `transactions` trong database MySQL.
    *   *Cách hoạt động*: App tìm tên danh mục tiếng Việt (ví dụ: "Ăn uống" tương ứng với ID "food") gửi lên backend để backend tự động mapping khóa ngoại.

---

## 🔐 Cơ Chế Quản Lý Token Trong App Store

Toàn bộ trạng thái xác thực và lưu trữ Token được tập trung quản lý tại tệp tin: [app-store.tsx](file:///c:/Users/HP/Desktop/React%20native/DuckLock/frontend/src/store/app-store.tsx).

### 1. Hàm Đăng Nhập (`login`) và Đăng Ký (`register`)
Khi gọi hàm thành công, kết quả trả về sẽ được dùng để cập nhật dữ liệu cục bộ:
```typescript
const result = await authService.login(email, password);
setUser(result.user);  // Lưu thông tin cá nhân
setToken(result.token); // Lưu Access Token
```

### 2. Tự Động Load Lại Dữ Liệu Khi Có Token (`useEffect`)
Chúng ta sử dụng `useEffect` lắng nghe sự thay đổi của biến `token`. Chỉ khi người dùng đã đăng nhập thành công và có `token` hợp lệ, App mới tiến hành gọi API tải danh sách giao dịch:
```typescript
useEffect(() => {
  if (token) {
    // Gọi API lấy danh sách giao dịch thực tế
    transactionService.listTransactions(token).then(setTransactions);
  } else {
    // Nếu đăng xuất (token = null), xóa sạch danh sách giao dịch
    setTransactions([]);
  }
}, [token]);
```

---

## 🛠️ Cách Gọi API Bằng `fetch` Trong Services

Chi tiết code gọi API được cài đặt trong:
*   [authService.ts](file:///c:/Users/HP/Desktop/React%20native/DuckLock/frontend/src/services/authService.ts): Xử lý đăng ký, đăng nhập.
*   [transactionService.ts](file:///c:/Users/HP/Desktop/React%20native/DuckLock/frontend/src/services/transactionService.ts): Xử lý giao dịch.

### 📝 Ví dụ cú pháp truyền Token ở Header:
Khi gọi các API cần bảo mật, chúng ta phải truyền Token qua Header `'Authorization'` với tiền tố `'Bearer '`:
```typescript
const response = await fetch(`${API_BASE_URL}/transactions`, {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}` // Gửi token lên để Backend giải mã xác thực
  }
});
```
