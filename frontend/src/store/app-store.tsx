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
import { localCategoryService } from '@/src/db/localCategoryService';
import { syncService } from '@/src/services/syncService';
import { formatCompactCurrency } from '../utils/format';

const parseDateSafe = (dateStr: string): Date => {
  if (!dateStr) return new Date();
  const formatted = dateStr.replace(' ', 'T');
  const d = new Date(formatted);
  return isNaN(d.getTime()) ? new Date(dateStr.slice(0, 10)) : d;
};

const getCategoryName = (categoryId: string, categoriesList: Category[]): string => {
  const found = categoriesList.find(c => c.id === categoryId);
  if (found) return found.name;
  const defaultNames: Record<string, string> = {
    food: 'Ăn uống',
    transport: 'Di chuyển',
    shopping: 'Mua sắm',
    bills: 'Hóa đơn',
    fun: 'Giải trí',
    health: 'Sức khỏe',
    salary: 'Lương',
    gym: 'Gym',
    coffee: 'Cà phê'
  };
  return defaultNames[categoryId] || 'Khác';
};

const getDisplayCategoryId = (rawCategoryId: string, categoriesList: Category[]): string => {
  const rawName = getCategoryName(rawCategoryId, categoriesList);
  const displayCat = categoriesList.find(c => c.name === rawName);
  return displayCat ? displayCat.id : rawCategoryId;
};

function calculateReportsOffline(transactions: Transaction[], categoriesList: Category[]): { report: ReportSummary; weeklyReport: number[] } {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth(); // 0-indexed

  let prevMonth = currentMonth - 1;
  let prevYear = currentYear;
  if (prevMonth === -1) {
    prevMonth = 11;
    prevYear = currentYear - 1;
  }

  // 1. Lọc giao dịch tháng này
  const thisMonthTxs = transactions.filter((t) => {
    const d = parseDateSafe(t.transactionDate);
    return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
  });

  // 2. Lọc giao dịch tháng trước
  const prevMonthTxs = transactions.filter((t) => {
    const d = parseDateSafe(t.transactionDate);
    return d.getFullYear() === prevYear && d.getMonth() === prevMonth;
  });

  const totalExpense = thisMonthTxs.filter((t) => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  const totalIncome = thisMonthTxs.filter((t) => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const prevExpense = prevMonthTxs.filter((t) => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);

  const diff = Math.abs(totalExpense - prevExpense);
  const compareText = totalExpense > prevExpense 
    ? `Tăng ${formatCompactCurrency(diff)} so với tháng trước` 
    : `Giảm ${formatCompactCurrency(diff)} so với tháng trước`;

  // Gom nhóm chi tiêu theo danh mục hiển thị chuẩn trong tháng này
  const breakdownMap = new Map<string, number>();
  thisMonthTxs.filter((t) => t.type === 'expense').forEach((t) => {
    const displayCatId = getDisplayCategoryId(t.categoryId || 'other', categoriesList);
    breakdownMap.set(displayCatId, (breakdownMap.get(displayCatId) || 0) + t.amount);
  });

  const totalAmount = Array.from(breakdownMap.values()).reduce((s, v) => s + v, 0);
  const categoryBreakdown = Array.from(breakdownMap.entries()).map(([categoryId, amount]) => ({
    categoryId,
    amount,
    percent: totalAmount > 0 ? Math.round((amount / totalAmount) * 100) : 0,
  }));

  const report: ReportSummary = {
    monthLabel: `Tháng ${currentMonth + 1} năm ${currentYear}`,
    totalExpense,
    totalIncome,
    compareText,
    dailySeries: [],
    categoryBreakdown,
  };

  // 3. Tính weeklyReport (Tuần hiện tại: Thứ 2 -> Chủ nhật)
  const currentDay = now.getDay(); // 0: CN, 1: T2, ..., 6: T7
  const distanceToMonday = currentDay === 0 ? -6 : 1 - currentDay;
  const monday = new Date(now);
  monday.setDate(now.getDate() + distanceToMonday);
  monday.setHours(0, 0, 0, 0);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  const weeklyReport = [0, 0, 0, 0, 0, 0, 0];
  transactions.filter((t) => {
    if (t.type !== 'expense') return false;
    const d = parseDateSafe(t.transactionDate);
    return d >= monday && d <= sunday;
  }).forEach((t) => {
    const d = parseDateSafe(t.transactionDate);
    const day = d.getDay();
    const index = day === 0 ? 6 : day - 1;
    weeklyReport[index] += t.amount;
  });

  return { report, weeklyReport };
}

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
          // Nạp categories mặc định từ SQLite local nếu chưa đăng nhập
          localCategoryService.listCategories().then(setCategories);
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

  const refreshData = useCallback(async () => {
    // Luôn luôn đọc dữ liệu từ SQLite local trước để UI hiển thị nhanh nhất
    const localWallets = await localWalletService.listWallets();
    const localTxs = await localTransactionService.listTransactions();
    const localCats = await localCategoryService.listCategories();
    
    setWallets(localWallets);
    setTransactions(localTxs);
    setCategories(localCats);

    // Tính toán báo cáo offline ngay từ dữ liệu local để UI thay đổi tức thì
    const localReports = calculateReportsOffline(localTxs, localCats);
    setReport(localReports.report);
    setWeeklyReport(localReports.weeklyReport);

    if (!token || isOffline) return;

    try {
      // Gọi ngầm đồng bộ dữ liệu với server
      await syncService.syncAll(token);

      // Sau khi đồng bộ thành công, đọc lại local database để cập nhật dữ liệu mới từ server về
      const updatedWallets = await localWalletService.listWallets();
      const updatedTxs = await localTransactionService.listTransactions();
      const updatedCats = await localCategoryService.listCategories();
      
      setWallets(updatedWallets);
      setTransactions(updatedTxs);
      setCategories(updatedCats);

      // Tính lại báo cáo từ dữ liệu local mới nhất
      const updatedReports = calculateReportsOffline(updatedTxs, updatedCats);
      setReport(updatedReports.report);
      setWeeklyReport(updatedReports.weeklyReport);
    } catch (error) {
      console.log('Thông báo: Đồng bộ ngầm thất bại (thiết bị hoạt động ở chế độ offline).');
    }
  }, [token, isOffline]);

  // 2. Tải dữ liệu khi Token thay đổi (Đăng nhập/Đăng xuất)
  useEffect(() => {
    // Nạp categories mặc định
    localCategoryService.listCategories().then(setCategories);
    
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
