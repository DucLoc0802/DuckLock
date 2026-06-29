import { UserRepository } from "../repository/user.repository";

interface LoginResult {
    success: boolean;
    message: string;
    data?: {
        token: string;
        username: string;
    }
}

export const LoginService = {
    login: async (username: string, password: string): Promise<LoginResult> => {
        const user = await UserRepository.FindByUserName(username);
        if (!user) {
            return {
                success: false,
                message: "Sai tài khoản hoặc mật khẩu"
            }
        }
        const isPasswordMatch = (password === user.password);
        if (!isPasswordMatch) {
            return {
                success: false,
                message: "Sai tài khoản hoặc mật khẩu"
            }
        }

        if (user.status === 'INACTIVE') {
            return {
                success: false,
                message: "Tài khoản đã ngừng hoạt động"
            }
        }

        const mockToken = `mock-token-${user.id}-123456`

        return {
            success: true,
            message: "Đăng nhập thành công",
            data: {
                token: mockToken,
                username: user.username
            }
        }
    }
}