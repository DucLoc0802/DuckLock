export type TransactionType = 'expense' | 'income';
export type SyncState = 'synced' | 'pending_create';
export type AsyncState = 'idle' | 'loading' | 'success' | 'empty' | 'error' | 'offline';

export interface User {
  id: string;
  name: string;
  email: string;
  defaultCurrency: string;
  avatar: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  isDefault: boolean;
}

export interface Transaction {
  id: string;
  categoryId: string;
  amount: number;
  type: TransactionType;
  note: string;
  transactionDate: string;
  createdAt: string;
  imageUri?: string;
  syncState: SyncState;
}

export interface ProofImage {
  id: string;
  imageUri: string;
  capturedAt: string;
  status: 'pending' | 'processed';
}

export interface ReportSummary {
  monthLabel: string;
  totalExpense: number;
  totalIncome: number;
  compareText: string;
  dailySeries: number[];
  categoryBreakdown: {
    categoryId: string;
    amount: number;
    percent: number;
  }[];
}

export interface CreateTransactionInput {
  amount: number;
  categoryId: string;
  type: TransactionType;
  note: string;
  transactionDate: string;
  walletId: string;
  imageUri?: string;
}

export type WalletType = 'CASH' | 'BANK' | 'SAVING' | 'OTHER';

export interface Wallet {
  id: string;
  name: string;
  type: WalletType;
  balance: number;
  currency: string;
  interest_rate_percent: number | null;
  created_at?: string | null;
}

export interface Budget {
  id: string;
  name: string;
  categoryId: string | null;
  amount: number;
  currency: string;
  budgetMonth: string;
  amountInDefaultCurrency: number | null;
  alertThresholdPercent: number;
  isActive?: boolean;
  createdAt?: string;
}

export interface BudgetInput {
  name: string;
  categoryId?: string | null;
  amount: number;
  budgetMonth: string;
  amountInDefaultCurrency?: number;
  alertThresholdPercent?: number;
  isActive?: boolean;
}

export type RecurringFrequency = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
export type BackendTransactionType = 'EXPENSE' | 'INCOME';

export interface RecurringTransaction {
  id: string;
  walletId: string;
  categoryId: string | null;
  name: string;
  amount: number;
  type: BackendTransactionType;
  description: string | null;
  frequency: RecurringFrequency;
  dayOfPeriod: number;
  startDate: string;
  endDate: string | null;
  lastExecutedAt?: string | null;
  nextExecutionDate: string;
  isActive: boolean;
  createdAt?: string;
}

export interface RecurringTransactionInput {
  walletId: string;
  categoryId?: string | null;
  name: string;
  amount: number;
  type: BackendTransactionType;
  description?: string | null;
  frequency: RecurringFrequency;
  dayOfPeriod: number;
  startDate: string;
  endDate?: string | null;
  nextExecutionDate: string;
  isActive?: boolean;
}

export interface WalletInterest {
  walletId: string;
  walletName: string;
  balance: number;
  interestRatePercent: number;
  dailyInterest: number;
  currency: string;
}
