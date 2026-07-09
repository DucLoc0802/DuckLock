import {
  Category,
  ProofImage,
  ReportSummary,
  Transaction,
  User,
} from '@/src/types/piggy';

export const mockUser: User = {
  id: 'user-1',
  name: 'Peezy',
  email: 'duclocbig@gmail.com',
  defaultCurrency: 'VND',
  avatar:
    'https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=crop&w=200&q=80',
};

export const mockCategories: Category[] = [
  { id: 'food', name: 'Ăn uống', icon: '🍜', color: '#FFD966', isDefault: true },
  { id: 'transport', name: 'Di chuyển', icon: '🛵', color: '#CDEFD5', isDefault: true },
  { id: 'shopping', name: 'Mua sắm', icon: '🛍️', color: '#FFD8BE', isDefault: true },
  { id: 'bills', name: 'Hóa đơn', icon: '🧾', color: '#DDEBFF', isDefault: true },
  { id: 'fun', name: 'Giải trí', icon: '🎮', color: '#FEE2E2', isDefault: true },
  { id: 'health', name: 'Sức khỏe', icon: '💊', color: '#DCFCE7', isDefault: true },
  { id: 'salary', name: 'Lương', icon: '💰', color: '#D6F5DD', isDefault: true },
  { id: 'gym', name: 'Gym', icon: '💪', color: '#E9D5FF', isDefault: false },
  { id: 'coffee', name: 'Cà phê', icon: '☕', color: '#FDE68A', isDefault: false },
];

export const mockTransactions: Transaction[] = [
  {
    id: 'txn-1',
    categoryId: 'coffee',
    amount: 45000,
    type: 'expense',
    note: 'Cà phê sáng',
    transactionDate: '2026-07-03T08:00:00.000Z',
    createdAt: '2026-07-03T08:05:00.000Z',
    syncState: 'synced',
  },
  {
    id: 'txn-2',
    categoryId: 'food',
    amount: 68000,
    type: 'expense',
    note: 'Trà sữa',
    transactionDate: '2026-07-02T14:00:00.000Z',
    createdAt: '2026-07-02T14:05:00.000Z',
    syncState: 'synced',
  },
  {
    id: 'txn-3',
    categoryId: 'transport',
    amount: 120000,
    type: 'expense',
    note: 'Taxi',
    transactionDate: '2026-07-02T09:00:00.000Z',
    createdAt: '2026-07-02T09:03:00.000Z',
    syncState: 'synced',
  },
  {
    id: 'txn-4',
    categoryId: 'shopping',
    amount: 265000,
    type: 'expense',
    note: 'Siêu thị',
    transactionDate: '2026-07-01T18:00:00.000Z',
    createdAt: '2026-07-01T18:10:00.000Z',
    imageUri:
      'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=500&q=80',
    syncState: 'synced',
  },
  {
    id: 'txn-5',
    categoryId: 'salary',
    amount: 18500000,
    type: 'income',
    note: 'Lương tháng',
    transactionDate: '2026-07-01T09:00:00.000Z',
    createdAt: '2026-07-01T09:01:00.000Z',
    syncState: 'synced',
  },
  {
    id: 'txn-6',
    categoryId: 'fun',
    amount: 190000,
    type: 'expense',
    note: 'Vé xem phim',
    transactionDate: '2026-06-29T20:00:00.000Z',
    createdAt: '2026-06-29T20:10:00.000Z',
    syncState: 'pending_create',
  },
];

export const mockProofImages: ProofImage[] = [
  {
    id: 'proof-1',
    imageUri:
      'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=500&q=80',
    capturedAt: '2026-07-03T07:10:00.000Z',
    status: 'pending',
  },
  {
    id: 'proof-2',
    imageUri:
      'https://images.unsplash.com/photo-1515003197210-e0cd71810b5f?auto=format&fit=crop&w=500&q=80',
    capturedAt: '2026-07-02T18:20:00.000Z',
    status: 'pending',
  },
  {
    id: 'proof-3',
    imageUri:
      'https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?auto=format&fit=crop&w=500&q=80',
    capturedAt: '2026-07-01T12:35:00.000Z',
    status: 'pending',
  },
];

export const mockReport: ReportSummary = {
  monthLabel: 'Tháng 7, 2026',
  totalExpense: 688000,
  totalIncome: 18500000,
  compareText: 'Chi tiêu giảm 12% so với tháng trước',
  dailySeries: [100, 40, 68, 120, 260, 190, 45],
  categoryBreakdown: [
    { categoryId: 'shopping', amount: 265000, percent: 38 },
    { categoryId: 'transport', amount: 120000, percent: 17 },
    { categoryId: 'fun', amount: 190000, percent: 28 },
    { categoryId: 'food', amount: 68000, percent: 10 },
    { categoryId: 'coffee', amount: 45000, percent: 7 },
  ],
};
