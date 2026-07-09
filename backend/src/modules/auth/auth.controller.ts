import { Request, Response } from "express";
import { AuthService } from "./auth.service";
import { LoginDto } from "./dto/login.dto";
import { RegisterDto } from "./dto/register.dto";

const isValidEmail = (email: string) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const AuthController = {
  login: async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body as LoginDto;

      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: "Vui lòng nhập đầy đủ email và mật khẩu",
        });
      }

      if (!isValidEmail(email)) {
        return res.status(400).json({
          success: false,
          message: "Email không hợp lệ",
        });
      }

      const result = await AuthService.login(email, password);
      return res.status(200).json({
        success: true,
        message: "Đăng nhập thành công",
        ...result,
      });
    } catch (error: any) {
      return res.status(401).json({
        success: false,
        message: error.message || "Đăng nhập thất bại",
      });
    }
  },

  register: async (req: Request, res: Response) => {
    try {
      const dto = req.body as RegisterDto;

      if (!dto.name || !dto.email || !dto.password) {
        return res.status(400).json({
          success: false,
          message: "Vui lòng nhập đầy đủ họ tên, email và mật khẩu",
        });
      }

      if (dto.name.length < 2 || dto.name.length > 50) {
        return res.status(400).json({
          success: false,
          message: "Họ tên từ 2 đến 50 ký tự",
        });
      }

      if (!isValidEmail(dto.email)) {
        return res.status(400).json({
          success: false,
          message: "Email không hợp lệ",
        });
      }

      if (dto.password.length < 6) {
        return res.status(400).json({
          success: false,
          message: "Mật khẩu tối thiểu 6 ký tự",
        });
      }

      const result = await AuthService.register(dto);
      return res.status(201).json({
        success: true,
        message: "Đăng ký thành công",
        ...result,
      });
    } catch (error: any) {
      const statusCode = error.message === "Email đã được sử dụng" ? 409 : 400;
      return res.status(statusCode).json({
        success: false,
        message: error.message || "Đăng ký thất bại",
      });
    }
  },
};
