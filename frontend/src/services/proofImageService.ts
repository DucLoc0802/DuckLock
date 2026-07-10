import { API_BASE_URL } from '@/src/config/api';
import { mockProofImages } from '@/src/mocks/piggy-data';
import { ProofImage } from '@/src/types/piggy';
import { randomDelay } from '@/src/utils/format';

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const proofImageService = {
  // 1. Lấy danh sách ảnh hóa đơn đang chờ xử lý từ MySQL
  async listPending(token?: string | null): Promise<ProofImage[]> {
    await wait(randomDelay());

    if (!token) return [];

    try {
      const response = await fetch(`${API_BASE_URL}/proof-images`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Lấy danh sách ảnh thất bại');
      }

      // Ánh xạ kiểu dữ liệu từ MySQL về React Native
      return result.data.map((item: any) => ({
        id: item.id,
        imageUri: item.image_url,
        capturedAt: item.captured_at,
        status: item.status.toLowerCase(),
      }));
    } catch (error) {
      // Đổi sang console.log để tránh hiện lỗi đỏ trên terminal khi bạn chưa code Backend
      console.log('Thông báo: Chưa tìm thấy API lấy danh sách ảnh chờ (sẽ dùng dữ liệu mock thay thế).');
      // Fallback về dữ liệu mock nếu lỗi kết nối
      return mockProofImages.filter((item) => item.status === 'pending');
    }
  },

  // 2. Upload ảnh hóa đơn mới chụp lên Backend qua FormData (Multipart)
  async uploadImage(imageUri: string, token: string | null): Promise<ProofImage> {
    await wait(randomDelay());

    // Nếu không có token xác thực, không thể upload
    if (!token) {
      throw new Error('Bạn cần đăng nhập để tải ảnh lên');
    }

    try {
      // Đóng gói ảnh vào đối tượng FormData để gửi tệp tin nhị phân qua HTTP
      const formData = new FormData();
      formData.append('image', {
        uri: imageUri,
        name: `receipt_${Date.now()}.jpg`, // Đặt tên file ngẫu nhiên
        type: 'image/jpeg', // Định dạng ảnh jpeg
      } as any);

      // Gọi API POST /api/proof-images để lưu tệp tin
      const response = await fetch(`${API_BASE_URL}/proof-images`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`, // Chỉ gửi Token, KHÔNG gửi Content-Type
        },
        body: formData,
      });

      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Tải ảnh hóa đơn lên thất bại');
      }

      return {
        id: result.data.id,
        imageUri: result.data.image_url,
        capturedAt: result.data.captured_at || new Date().toISOString(),
        status: 'pending',
      };
    } catch (error) {
      console.log('Thông báo: Chưa có API upload ảnh (sẽ lưu tạm local ở chế độ giả lập).');
      
      // Fallback: Nếu backend chưa code xong, giả lập upload thành công để lưu local
      return {
        id: `mock-proof-${Date.now()}`,
        imageUri: imageUri,
        capturedAt: new Date().toISOString(),
        status: 'pending',
      };
    }
  },
};
