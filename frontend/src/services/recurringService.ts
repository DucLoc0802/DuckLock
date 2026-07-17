import { API_BASE_URL } from '@/src/config/api';
import { RecurringTransaction, RecurringTransactionInput } from '@/src/types/piggy';

function mapRecurring(item: any): RecurringTransaction {
  return {
    id: String(item.id),
    walletId: item.wallet_id ?? item.walletId,
    categoryId: item.category_id ?? item.categoryId ?? null,
    name: item.name || 'Giao dá»‹ch Ä‘á»‹nh ká»³',
    amount: Number(item.amount) || 0,
    type: item.type === 'income' ? 'INCOME' : item.type === 'expense' ? 'EXPENSE' : item.type,
    description: item.description ?? null,
    frequency: item.frequency,
    dayOfPeriod: Number(item.day_of_period ?? item.dayOfPeriod) || 1,
    startDate: item.start_date ?? item.startDate,
    endDate: item.end_date ?? item.endDate ?? null,
    lastExecutedAt: item.last_executed_at ?? item.lastExecutedAt ?? null,
    nextExecutionDate: item.next_execution_date ?? item.nextExecutionDate,
    isActive: item.is_active ?? item.isActive ?? true,
    createdAt: item.created_at ?? item.createdAt,
  };
}

async function requestRecurring(path: string, token: string | null, options?: RequestInit) {
  if (!token) throw new Error('Báº¡n cáº§n Ä‘Äƒng nháº­p Ä‘á»ƒ thá»±c hiá»‡n');

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(options?.headers || {}),
    },
  });
  const result = await response.json();
  if (!response.ok || !result.success) {
    throw new Error(result.message || 'KhÃ´ng thá»ƒ káº¿t ná»‘i giao dá»‹ch Ä‘á»‹nh ká»³');
  }
  return result.data;
}

export const recurringService = {
  async listRecurringTransactions(token: string | null): Promise<RecurringTransaction[]> {
    const data = await requestRecurring('/recurring-transactions', token);
    return Array.isArray(data) ? data.map(mapRecurring) : [];
  },

  async getDue(token: string | null): Promise<RecurringTransaction[]> {
    const data = await requestRecurring('/recurring-transactions/due', token);
    return Array.isArray(data) ? data.map(mapRecurring) : [];
  },

  async createRecurringTransaction(input: RecurringTransactionInput, token: string | null) {
    const data = await requestRecurring('/recurring-transactions', token, {
      method: 'POST',
      body: JSON.stringify(input),
    });
    return mapRecurring(data);
  },

  async updateRecurringTransaction(id: string, input: RecurringTransactionInput, token: string | null) {
    const data = await requestRecurring(`/recurring-transactions/${id}`, token, {
      method: 'PUT',
      body: JSON.stringify(input),
    });
    return mapRecurring(data);
  },

  async deleteRecurringTransaction(id: string, token: string | null) {
    await requestRecurring(`/recurring-transactions/${id}`, token, { method: 'DELETE' });
  },

  async confirmDue(id: string, token: string | null) {
    await requestRecurring(`/recurring-transactions/due/${id}`, token, { method: 'POST' });
  },
};
