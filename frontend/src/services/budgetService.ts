import { API_BASE_URL } from '@/src/config/api';
import { Budget, BudgetInput } from '@/src/types/piggy';

function mapBudget(item: any): Budget {
  return {
    id: String(item.id),
    name: item.name || 'NgÃ¢n sÃ¡ch',
    categoryId: item.category_id ?? item.categoryId ?? null,
    amount: Number(item.amount) || 0,
    currency: item.currency || 'VND',
    budgetMonth: item.budget_month ?? item.budgetMonth ?? new Date().toISOString().slice(0, 10),
    amountInDefaultCurrency:
      item.amount_in_default_currency !== undefined
        ? Number(item.amount_in_default_currency)
        : item.amountInDefaultCurrency ?? null,
    alertThresholdPercent:
      Number(item.alert_threshold_percent ?? item.alertThresholdPercent) || 80,
    isActive: item.is_active ?? item.isActive ?? true,
  };
}

async function requestBudget(path: string, token: string | null, options?: RequestInit) {
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
    throw new Error(result.message || 'KhÃ´ng thá»ƒ káº¿t ná»‘i ngÃ¢n sÃ¡ch');
  }
  return result.data;
}

export const budgetService = {
  async listBudgets(token: string | null): Promise<Budget[]> {
    const data = await requestBudget('/budgets', token);
    return Array.isArray(data) ? data.map(mapBudget) : [];
  },

  async createBudget(input: BudgetInput, token: string | null): Promise<Budget> {
    const data = await requestBudget('/budgets', token, {
      method: 'POST',
      body: JSON.stringify(input),
    });
    return mapBudget(data);
  },

  async updateBudget(id: string, input: BudgetInput, token: string | null): Promise<Budget> {
    const data = await requestBudget(`/budgets/${id}`, token, {
      method: 'PUT',
      body: JSON.stringify(input),
    });
    return mapBudget(data);
  },

  async deleteBudget(id: string, token: string | null): Promise<void> {
    await requestBudget(`/budgets/${id}`, token, { method: 'DELETE' });
  },
};
