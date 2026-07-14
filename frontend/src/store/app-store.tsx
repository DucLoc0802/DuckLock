import React, { createContext, useContext, useEffect, useState } from 'react';

import { authService } from '@/src/services/authService';
import { categoryService } from '@/src/services/categoryService';
import { proofImageService } from '@/src/services/proofImageService';
import { reportService } from '@/src/services/reportService';
import { transactionService } from '@/src/services/transactionService';
import {
  AsyncState,
  Category,
  CreateTransactionInput,
  ProofImage,
  ReportSummary,
  Transaction,
  User,
  Wallet,
} from '@/src/types/piggy';
import { walletService } from '@/src/services/walletService';

interface AppStoreValue {
  authState: AsyncState;
  user: User | null;
  token: string | null;
  transactions: Transaction[];
  categories: Category[];
  proofImages: ProofImage[];
  report: ReportSummary | null;
  weeklyReport: number[];
  isOffline: boolean;
  wallets: Wallet[];
  loadWallets: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  addTransaction: (input: CreateTransactionInput) => Promise<void>;
  updateTransaction: (id: string, input: CreateTransactionInput) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  uploadProofImage: (imageUri: string) => Promise<void>;
  toggleOffline: () => void;
  syncCategory: (category: Category) => void;
}

const AppStoreContext = createContext<AppStoreValue | null>(null);

export function AppStoreProvider({ children }: { children: React.ReactNode }) {
  const [authState, setAuthState] = useState<AsyncState>('idle');
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [proofImages, setProofImages] = useState<ProofImage[]>([]);
  const [report, setReport] = useState<ReportSummary | null>(null);
  const [weeklyReport, setWeeklyReport] = useState<number[]>([0, 0, 0, 0, 0, 0, 0]);
  const [isOffline, setIsOffline] = useState(false);
  const [wallets, setWallets] = useState<Wallet[]>([]);

  async function loadWallets() {
    if (!token) return;
    const data = await walletService.listWallets(token);
    setWallets(data);
  }

  // 1. Tự động tải lại dữ liệu khi Token thay đổi (Người dùng đã Đăng nhập thành công)
  useEffect(() => {
    // Tải danh mục giả lập (Frontend Mock)
    categoryService.listCategories().then(setCategories);
    
    if (token) {
      loadWallets();
      // KẾT NỐI THẬT: Lấy danh sách giao dịch từ MySQL Backend
      transactionService.listTransactions(token).then((txs) => {
        setTransactions(txs);
        
        // Trích xuất các danh mục động từ giao dịch trả về từ Backend
        // để bổ sung vào categories state nếu chưa tồn tại
        txs.forEach((tx: any) => {
          if (tx.rawCategory) {
            setCategories((prev) => {
              if (prev.some((c) => c.id === tx.rawCategory.id)) return prev;
              return [...prev, tx.rawCategory];
            });
          }
        });
      });
      // Lấy danh sách ảnh hóa đơn đang chờ xử lý từ Backend
      proofImageService.listPending(token).then(setProofImages);
      
      // Gọi API lấy báo cáo tháng thật từ Backend
      reportService.getMonthlySummary(token).then((data) => {
        if (data) setReport(data);
      });

      // Gọi API lấy báo cáo tuần thật từ Backend
      reportService.getWeeklySummary(token).then((data) => {
        if (data && data.dailySeries) {
          setWeeklyReport(data.dailySeries);
        }
      });
    } else {
      // Nếu đăng xuất, xóa sạch danh sách giao dịch hiển thị
      setTransactions([]);
      setWallets([]);
    }
  }, [token]);

  async function login(email: string, password: string) {
    setAuthState('loading');
    try {
      // Gọi API đăng nhập và cập nhật thông tin người dùng nếu thành công
      const result = await authService.login(email, password);
      setUser(result.user);
      setToken(result.token);
      setAuthState('success');
    } catch (error) {
      // Khi lỗi xảy ra (sai mật khẩu, server lỗi...), phải reset authState
      // về 'idle' để nút bấm trở lại bình thường, không bị kẹt ở trạng thái 'loading'
      setAuthState('idle');
      throw error; // Ném lỗi lên trên để LoginScreen hiển thị thông báo lỗi cho người dùng
    }
  }

  async function register(name: string, email: string, password: string) {
    setAuthState('loading');
    try {
      // Gọi API đăng ký và tự động đăng nhập người dùng sau khi thành công
      const result = await authService.register(name, email, password);
      setUser(result.user);
      setToken(result.token);
      setAuthState('success');
    } catch (error) {
      // Tương tự login, phải reset lại trạng thái để nút không bị kẹt
      setAuthState('idle');
      throw error;
    }
  }

  function logout() {
    setUser(null);
    setToken(null);
    setAuthState('idle');
  }

  async function addTransaction(input: CreateTransactionInput) {
    // Tìm tên danh mục tiếng Việt từ categoryId (ví dụ: 'food' -> 'Ăn uống')
    // Vì Backend MySQL lưu và kiểm soát theo Tên danh mục (categoryName)
    const categoryName = categories.find((c) => c.id === input.categoryId)?.name || 'Khác';
    
    // Truyền thêm biến token và categoryName để lưu vào DB MySQL
    const created = await transactionService.createTransaction(input, token, isOffline, categoryName);
    setTransactions((current) => [created, ...current]);
    loadWallets(); // Cập nhật lại số dư ví
  }

  async function updateTransaction(id: string, input: CreateTransactionInput) {
    const categoryName = categories.find((c) => c.id === input.categoryId)?.name || 'Khác';
    const updated = await transactionService.updateTransaction(id, input, token, categoryName);
    setTransactions((current) => current.map((t) => (t.id === id ? updated : t)));
    loadWallets(); // Cập nhật lại số dư ví
  }

  async function deleteTransaction(id: string) {
    await transactionService.deleteTransaction(id, token);
    setTransactions((current) => current.filter((tx) => tx.id !== id));
    loadWallets(); // Cập nhật lại số dư ví
  }

  async function uploadProofImage(imageUri: string) {
    const newImage = await proofImageService.uploadImage(imageUri, token);
    setProofImages((current) => [newImage, ...current]);
  }

  function syncCategory(category: Category) {
    setCategories((prev) => {
      if (prev.some((c) => c.id === category.id)) return prev;
      return [...prev, category];
    });
  }

  function toggleOffline() {
    setIsOffline((current) => !current);
  }

  return (
    <AppStoreContext.Provider
      value={{
        authState,
        user,
        token,
        transactions,
        categories,
        proofImages,
        report,
        weeklyReport,
        isOffline,
        wallets,
        loadWallets,
        login,
        register,
        logout,
        addTransaction,
        updateTransaction,
        deleteTransaction,
        uploadProofImage,
        toggleOffline,
        syncCategory,
      }}>
      {children}
    </AppStoreContext.Provider>
  );
}

export function useAppStore() {
  const context = useContext(AppStoreContext);
  if (!context) {
    throw new Error('useAppStore must be used inside AppStoreProvider');
  }

  return context;
}
