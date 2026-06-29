// src/routes/auth.routes.ts
import { Router } from 'express';
import { LoginController } from '../controllers/auth.controller';

// 1. SYNTAX: Khởi tạo một cái Router nhánh từ thư viện Express
const authRouter = Router();

// 2. THUẬT TOÁN: Định tuyến cho chức năng Đăng nhập
// Cú pháp: router.phương_thức('đường_dẫn_nhánh', hàm_controller)
authRouter.post('/login', LoginController);

// 3. SYNTAX: Xuất cái Router này ra ngoài để file index.ts có thể import vào xài
export default authRouter;