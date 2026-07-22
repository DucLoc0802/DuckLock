import { Request, Response } from "express";
import { ProofImagesService } from "./proof-images.services";
import { asyncHandler } from "../../utils/async-handler";
import { AppError } from "../../utils/app-errors";

export const ProofImagesController = {
    uploadImage: asyncHandler(async (req: Request, res: Response) => {
        const userId = req.userId!;

        // Multer gán thông tin file tải lên vào req.file
        if (!req.file) {
            throw new AppError(400, "Vui lòng đính kèm file ảnh hóa đơn");
        }

        // Tạo link URL của ảnh tĩnh trên server để gửi về cho client
        // Ví dụ: http://localhost:5000/uploads/proof_images/ten_file.jpg
        const protocol = req.protocol;
        const host = req.get("host");
        const imageUrl = `${protocol}://${host}/uploads/proof_images/${req.file.filename}`;

        // Lưu thông tin ảnh vào MySQL
        const result = await ProofImagesService.saveImageInfo(userId, imageUrl);

        return res.status(201).json({
            success: true,
            message: "Tải ảnh hóa đơn lên thành công",
            data: result
        });
    })
};
