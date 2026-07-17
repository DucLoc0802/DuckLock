import { Request, Response } from "express";
import { AuthService } from "./auth.service";
import { LoginDto } from "./dto/login.dto";
import { RegisterDto } from "./dto/register.dto";
import { asyncHandler } from "../../utils/async-handler";
import { AppError } from "../../utils/app-errors";

const isValidEmail = (email: string) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const AuthController = {
  login: asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = req.body as LoginDto;

    if (!email || !password) {
      throw new AppError(400, "Vui lòng nhập đầy đủ email và mật khẩu");
    }

    if (!isValidEmail(email)) {
      throw new AppError(400, "Email không hợp lệ");
    }

    const result = await AuthService.login(email, password);
    return res.status(200).json({
      success: true,
      message: "Đăng nhập thành công",
      ...result,
    });
  }),

  register: asyncHandler(async (req: Request, res: Response) => {
    const dto = req.body as RegisterDto;

    if (!dto.name || !dto.email || !dto.password) {
      throw new AppError(400, "Vui lòng nhập đầy đủ họ tên, email và mật khẩu");
    }

    if (dto.name.length < 2 || dto.name.length > 50) {
      throw new AppError(400, "Họ tên từ 2 đến 50 ký tự");
    }

    if (!isValidEmail(dto.email)) {
      throw new AppError(400, "Email không hợp lệ");
    }

    if (dto.password.length < 6) {
      throw new AppError(400, "Mật khẩu tối thiểu 6 ký tự");
    }

    const result = await AuthService.register(dto);
    return res.status(201).json({
      success: true,
      message: "Đăng ký thành công",
      ...result,
    });
  }),
};
