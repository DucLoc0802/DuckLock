import { API_BASE_URL } from '@/src/config/api';
import { mockUser } from '@/src/mocks/piggy-data';
import { User } from '@/src/types/piggy';
import { randomDelay } from '@/src/utils/format';

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const authService = {
  // 1. Hàm Đăng nhập kết nối với API Backend
  async login(email: string, password: string): Promise<{ token: string; user: User }> {
    await wait(randomDelay());
    
    // Kiểm tra tính hợp lệ của dữ liệu đầu vào ở phía Client (Validation)
    if (!email || password.length < 6) {
      throw new Error('Thông tin đăng nhập chưa hợp lệ');
    }

    // BƯỚC 1: Gọi API Đăng nhập của Backend thông qua hàm fetch
    // Endpoint: POST http://localhost:5000/api/auth/login
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json', // Báo cho server biết định dạng dữ liệu là JSON
      },
      body: JSON.stringify({
        email, // Gửi email lên trường email ở backend
        password, // Gửi mật khẩu thô
      }),
    });

    // BƯỚC 2: Giải mã dữ liệu JSON phản hồi từ Server
    const result = (await response.json()) as {
      success: boolean;
      message: string;
      access_token?: string; // Nhận về access_token nếu đăng nhập đúng
      user?: {
        id: string;
        name: string;
        email: string;
        avatar_url: string | null;
        default_currency: string;
      };
    };

    // BƯỚC 3: Kiểm tra HTTP status và cờ success trả về từ server
    // Nếu xảy ra lỗi (không thành công), ném ra lỗi để hiển thị trên giao diện App
    if (!response.ok || !result.success || !result.access_token || !result.user) {
      throw new Error(result.message || 'Đăng nhập thất bại');
    }

    // BƯỚC 4: Trả về dữ liệu đã được định dạng đúng cho App sử dụng
    return {
      token: result.access_token, // Access Token dùng làm chìa khóa gọi các API tiếp theo
      user: {
        id: result.user.id,
        name: result.user.name,
        email: result.user.email,
        defaultCurrency: result.user.default_currency,
        avatar: result.user.avatar_url || '',
      },
    };
  },

  // 2. Hàm Đăng ký tài khoản kết nối với API Backend
  async register(name: string, email: string, password: string): Promise<{ token: string; user: User }> {
    await wait(randomDelay());
    
    // Kiểm tra dữ liệu đầu vào ở phía Client
    if (!name || !email || password.length < 6) {
      throw new Error('Thông tin đăng ký chưa hợp lệ');
    }

    // BƯỚC 1: Gửi Request Đăng ký tài khoản mới lên Server
    // Endpoint: POST http://localhost:5000/api/auth/register
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name,
        email,
        password,
      }),
    });

    // BƯỚC 2: Nhận kết quả phản hồi từ Backend
    const result = (await response.json()) as {
      success: boolean;
      message: string;
      access_token?: string;
      user?: {
        id: string;
        name: string;
        email: string;
        avatar_url: string | null;
        default_currency: string;
      };
    };

    // BƯỚC 3: Kiểm tra tính thành công của request
    if (!response.ok || !result.success || !result.access_token || !result.user) {
      throw new Error(result.message || 'Đăng ký thất bại');
    }

    // BƯỚC 4: Tự động đăng nhập người dùng sau khi đăng ký thành công
    return {
      token: result.access_token,
      user: {
        id: result.user.id,
        name: result.user.name,
        email: result.user.email,
        defaultCurrency: result.user.default_currency,
        avatar: result.user.avatar_url || '',
      },
    };
  },
};
