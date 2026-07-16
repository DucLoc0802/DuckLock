// backend/src/utils/app-error.ts

export class AppError extends Error {
    public readonly statusCode: number;
    public readonly status: string;
    public readonly isOperational: boolean;

    constructor(statusCode: number, message: string) {
        super(message);

        this.statusCode = statusCode;
        // status là 'fail' cho đầu 4xx (lỗi người dùng), và 'error' cho các đầu khác (5xx - lỗi server)
        this.status = `${statusCode}`.startsWith("4") ? "fail" : "error";

        // Đánh dấu đây là lỗi nghiệp vụ do ta chủ động kiểm soát (Operational Error)
        // Phân biệt với lỗi hệ thống/lỗi thư viện crash bất ngờ (như lỗi cú pháp code)
        this.isOperational = true;

        // Giữ lại stack trace (vết dòng lỗi) giúp debug dễ dàng hơn
        Error.captureStackTrace(this, this.constructor);
    }
}
