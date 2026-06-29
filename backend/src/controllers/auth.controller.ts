import { Request, Response } from "express";
import { LoginRequest } from "../types/auth.types";
import { LoginService } from "../services/auth.services";

export const LoginController = async (req: Request, res: Response) => {
    const { username, password } = req.body as LoginRequest;

    if (!username || !password) {
        return res.status(400).json({
            success: false,
            message: "Vui lòng nhập đầy đủ tài khoản, mật khẩu"
        })
    }

    const result = await LoginService.login(username, password);

    if (result.success) {
        return res.status(200).json({
            success: true,
            message: result.message,
            data: result.data
        })
    }
    else {
        return res.status(401).json({
            success: false,
            message: result.message,
            data: result.data
        })
    }
}