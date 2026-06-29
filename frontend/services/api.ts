import Constants from 'expo-constants';

// Cấu hình địa chỉ IP của server backend.
// - Nếu chạy trên giả lập iOS: 'http://localhost:5000'
// - Nếu chạy trên giả lập Android: 'http://10.0.2.2:5000'
// - Nếu chạy trên thiết bị thật (điện thoại của bạn): Hãy đổi thành IP mạng LAN của máy tính (ví dụ: 'http://192.168.1.5:5000')
const API_BASE_URL = 'http://localhost:5000'; // Đổi ở đây nếu dùng Android hoặc thiết bị thật

export interface Goal {
  _id: string;
  text: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Lấy toàn bộ danh sách mục tiêu từ Backend
 */
export const fetchGoals = async (): Promise<Goal[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/goals`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Lỗi khi gọi API fetchGoals:', error);
    throw error;
  }
};

/**
 * Thêm một mục tiêu mới lên Backend
 */
export const addGoalToApi = async (text: string): Promise<Goal> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/goals`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text }),
    });
    
    if (!response.ok) {
      const errData = await response.json();
      throw new Error(errData.message || `HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Lỗi khi gọi API addGoalToApi:', error);
    throw error;
  }
};

/**
 * Xóa một mục tiêu khỏi Backend
 */
export const deleteGoalFromApi = async (id: string): Promise<{ id: string; message: string }> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/goals/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Lỗi khi gọi API deleteGoalFromApi:', error);
    throw error;
  }
};
