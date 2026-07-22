import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { ProofImagesController } from "./proof-images.controller";
import { authenticateJWT } from "../../middlewares/auth.middleware";
import { AppError } from "../../utils/app-errors";

const router = Router();

// 1. Cấu hình thư mục lưu file và tên file
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = "uploads/proof_images";
        // Tự động tạo thư mục nếu chưa tồn tại
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        // Tạo tên file ngẫu nhiên duy nhất tránh trùng: timestamp-so_ngau_nhien.jpg
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        const ext = path.extname(file.originalname);
        cb(null, `receipt-${uniqueSuffix}${ext}`);
    }
});

// 2. Cấu hình bộ lọc chỉ chấp nhận file ảnh
const fileFilter = (req: any, file: Express.Multer.File, cb: any) => {
    const allowedMimeTypes = ["image/jpeg", "image/png", "image/webp"];
    if (allowedMimeTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new AppError(400, "Định dạng file không hợp lệ. Chỉ chấp nhận ảnh JPG, PNG, WEBP!"), false);
    }
};

// 3. Khởi tạo middleware upload
const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // Giới hạn kích thước file tối đa 5MB
    }
});

// Định nghĩa route POST /api/proof-images
// Middleware: Xác thực Token -> Multer xử lý nhận 1 file có key là 'image' -> Controller lưu DB
router.post("/", authenticateJWT, upload.single("image"), ProofImagesController.uploadImage);

export const ProofImagesModule = {
    router
};
