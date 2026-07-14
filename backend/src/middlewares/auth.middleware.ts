import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

// Khai báo mở rộng TypeScript để đối tượng Request của Express có thể chứa thuộc tính userId
declare global {
    namespace Express {
        interface Request {
            userId?: string;
        }
    }
}

export const authenticateJWT = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ success: false, message: "Không tìm thấy token" });
    }

    const token = authHeader.split(" ")[1];
    const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || "ducklockquynhanhaccess";

    try {
        const decoded = jwt.verify(token, ACCESS_SECRET) as { userId: string };

        // Gán userId giải mã được vào đối tượng req để controller phía sau dùng luôn
        req.userId = decoded.userId;

        next(); // Cho phép đi tiếp vào Controller
    } catch (jwtError) {
        return res.status(401).json({ success: false, message: "Phiên đăng nhập hết hạn hoặc không hợp lệ" });
    }
};
