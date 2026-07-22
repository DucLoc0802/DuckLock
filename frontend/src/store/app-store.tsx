import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

import { authService } from '@/src/services/authService';
import { categoryService } from '@/src/services/categoryService';
import { proofImageService } from '@/src/services/proofImageService';
import { reportService } from '@/src/services/reportService';
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
import { Toast } from '@/components/ui/Toast';
import { LocalDatabase } from '@/src/db/localDatabase';
import { localWalletService } from '@/src/db/localWalletService';
import { localTransactionService } from '@/src/db/localTransactionService';
import { syncService } from '@/src/services/syncService';

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
  refreshData: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  addTransaction: (input: CreateTransactionInput) => Promise<void>;
  updateTransaction: (id: string, input: CreateTransactionInput) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  uploadProofImage: (imageUri: string) => Promise<void>;
  toggleOffline: () => void;
  syncCategory: (category: Category) => void;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
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

  // 1. Khởi tạo SQLite database local khi mở app và phục hồi phiên đăng nhập
  useEffect(() => {
    async function initDbAndSession() {
      try {
        await LocalDatabase.initialize();
        const db = await LocalDatabase.getDb();
        
        // Phục hồi session đăng nhập nếu có
        const tokenRecord = await db.getFirstAsync<any>("SELECT value FROM sync_meta WHERE key = 'auth_token'");
        const userRecord = await db.getFirstAsync<any>("SELECT value FROM sync_meta WHERE key = 'auth_user'");
        
        if (tokenRecord && tokenRecord.value && userRecord && userRecord.value) {
          setToken(tokenRecord.value);
          setUser(JSON.parse(userRecord.value));
        } else {
          // Nạp categories mặc định nếu chưa đăng nhập
          categoryService.listCategories().then(setCategories);
        }
      } catch (err) {
        console.error('Không thể khởi tạo database hoặc phục hồi session:', err);
      }
    }
    initDbAndSession();
  }, []);

  async function loadWallets() {
    const data = await localWalletService.listWallets();
    setWallets(data);
  }

  async function refreshData() {
    // Luôn luôn đọc dữ liệu từ SQLite local trước để UI hiển thị nhanh nhất
    const localWallets = await localWalletService.listWallets();
    const localTxs = await localTransactionService.listTransactions();
    
    setWallets(localWallets);
    setTransactions(localTxs);

    if (!token || isOffline) return;

    try {
      // Gọi ngầm đồng bộ dữ liệu với server
      await syncService.syncAll(token);

      // Sau khi đồng bộ thành công, đọc lại local database để cập nhật dữ liệu mới từ server về
      const updatedWallets = await localWalletService.listWallets();
      const updatedTxs = await localTransactionService.listTransactions();
      
      setWallets(updatedWallets);
      setTransactions(updatedTxs);

      // Cập nhật các báo cáo tuần/tháng online từ backend
      const [nextReport, nextWeeklyReport] = await Promise.all([
        reportService.getMonthlySummary(token),
        reportService.getWeeklySummary(token),
      ]);

      if (nextReport) setReport(nextReport);
      if (nextWeeklyReport?.dailySeries) {
        setWeeklyReport(nextWeeklyReport.dailySeries);
      }
    } catch (error) {
      console.log('Thông báo: Đồng bộ ngầm thất bại (thiết bị hoạt động ở chế độ offline).');
    }
  }

  // 2. Tải dữ liệu khi Token thay đổi (Đăng nhập/Đăng xuất)
  useEffect(() => {
    // Nạp categories mặc định
    categoryService.listCategories().then(setCategories);
    
    if (token) {
      // 1. Tải nhanh từ SQLite local để hiện UI lập tức
      loadWallets();
      localTransactionService.listTransactions().then(setTransactions);

      // 2. Chạy đồng bộ ngầm và làm mới dữ liệu
      syncService.syncAll(token).then(() => {
        refreshData();
      });

      // Nạp danh sách ảnh chờ xử lý
      proofImageService.listPending(token).then(setProofImages);
    } else {
      // Reset khi đăng xuất
      setTransactions([]);
      setWallets([]);
      setReport(null);
      setWeeklyReport([0, 0, 0, 0, 0, 0, 0]);
    }
  }, [token]);

  async function login(email: string, password: string) {
    setAuthState('loading');
    try {
      const result = await authService.login(email, password);
      setUser(result.user);
      setToken(result.token);
      
      // Lưu session vào SQLite
      const db = await LocalDatabase.getDb();
      await db.runAsync("INSERT OR REPLACE INTO sync_meta (key, value) VALUES ('auth_token', ?)", [result.token]);
      await db.runAsync("INSERT OR REPLACE INTO sync_meta (key, value) VALUES ('auth_user', ?)", [JSON.stringify(result.user)]);
      
      setAuthState('success');
    } catch (error) {
      setAuthState('idle');
      throw error;
    }
  }

  async function register(name: string, email: string, password: string) {
    setAuthState('loading');
    try {
      const result = await authService.register(name, email, password);
      setUser(result.user);
      setToken(result.token);

      // Lưu session vào SQLite
      const db = await LocalDatabase.getDb();
      await db.runAsync("INSERT OR REPLACE INTO sync_meta (key, value) VALUES ('auth_token', ?)", [result.token]);
      await db.runAsync("INSERT OR REPLACE INTO sync_meta (key, value) VALUES ('auth_user', ?)", [JSON.stringify(result.user)]);

      setAuthState('success');
    } catch (error) {
      setAuthState('idle');
      throw error;
    }
  }

  async function logout() {
    setUser(null);
    setToken(null);
    setAuthState('idle');
    
    // Xóa session và dọn sạch SQLite local
    try {
      const db = await LocalDatabase.getDb();
      await db.runAsync("DELETE FROM sync_meta WHERE key IN ('auth_token', 'auth_user', 'last_pulled_at')");
      await db.runAsync("DELETE FROM wallets");
      await db.runAsync("DELETE FROM transactions");
      await db.runAsync("DELETE FROM budgets");
      await db.runAsync("DELETE FROM categories");
      await db.runAsync("DELETE FROM sync_queue");
    } catch (err) {
      console.error('Lỗi dọn dẹp database khi đăng xuất:', err);
    }
  }

  async function addTransaction(input: CreateTransactionInput) {
    // 1. Thêm trực tiếp vào SQLite local (Cập nhật số dư ví và tạo queue đồng bộ tự động)
    const created = await localTransactionService.createTransaction(input);
    
    // 2. Cập nhật state UI nhanh
    setTransactions((current) => [created, ...current]);
    
    // 3. Kích hoạt đồng bộ ngầm lên server
    if (token && !isOffline) {
      syncService.syncAll(token).then(() => refreshData());
    } else {
      await refreshData();
    }
  }

  async function updateTransaction(id: string, input: CreateTransactionInput) {
    // 1. Cập nhật trực tiếp vào SQLite local
    await localTransactionService.updateTransaction(id, input);
    
    // 2. Kích hoạt đồng bộ ngầm lên server
    if (token && !isOffline) {
      syncService.syncAll(token).then(() => refreshData());
    } else {
      await refreshData();
    }
  }

  async function deleteTransaction(id: string) {
    // 1. Xóa trực tiếp trong SQLite local
    await localTransactionService.deleteTransaction(id);
    
    // 2. Kích hoạt đồng bộ ngầm lên server
    if (token && !isOffline) {
      syncService.syncAll(token).then(() => refreshData());
    } else {
      await refreshData();
    }
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

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type });
  }, []);

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
        refreshData,
        login,
        register,
        logout,
        addTransaction,
        updateTransaction,
        deleteTransaction,
        uploadProofImage,
        toggleOffline,
        syncCategory,
        showToast,
      }}>
      {children}
      {toast ? (
        <Toast
          message={toast.message}
          type={toast.type}
          onDismiss={() => setToast(null)}
        />
      ) : null}
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
