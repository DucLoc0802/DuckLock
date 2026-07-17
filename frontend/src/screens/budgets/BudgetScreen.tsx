import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { AppHeader } from '@/components/ui/AppHeader';
import { AppScreen } from '@/components/ui/AppScreen';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { SecondaryButton } from '@/components/ui/SecondaryButton';
import { budgetService } from '@/src/services/budgetService';
import { useAppStore } from '@/src/store/app-store';
import { Budget } from '@/src/types/piggy';
import { colors, radius, shadows, spacing } from '@/src/theme/tokens';
import { formatCompactCurrency, formatCurrencyInput, parseCurrencyInput } from '@/src/utils/format';

const currentMonth = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-01`;

export function BudgetScreen() {
  const { token, categories, report } = useAppStore();
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [threshold, setThreshold] = useState('80');

  const expenseCategories = useMemo(() => categories.filter((item) => item.id !== 'salary'), [categories]);

  const loadBudgets = useCallback(async () => {
    try {
      setLoading(true);
      setBudgets(await budgetService.listBudgets(token));
    } catch (error: any) {
      Alert.alert('Lỗi', error.message || 'Không thể tải ngân sách');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadBudgets();
  }, [loadBudgets]);

  function resetForm() {
    setEditingId(null);
    setName('');
    setAmount('');
    setCategoryId(null);
    setThreshold('80');
  }

  function startEdit(item: Budget) {
    setEditingId(item.id);
    setName(item.name);
    setAmount(formatCurrencyInput(item.amount));
    setCategoryId(item.categoryId);
    setThreshold(String(item.alertThresholdPercent || 80));
  }

  async function saveBudget() {
    const parsedAmount = parseCurrencyInput(amount);
    if (!name.trim() || parsedAmount <= 0) {
      Alert.alert('Chưa hợp lệ', 'Vui lòng nhập tên và số tiền ngân sách');
      return;
    }

    try {
      setSaving(true);
      const input = {
        name: name.trim(),
        amount: parsedAmount,
        categoryId,
        budgetMonth: currentMonth,
        amountInDefaultCurrency: parsedAmount,
        alertThresholdPercent: Number(threshold) || 80,
      };
      if (editingId) {
        await budgetService.updateBudget(editingId, input, token);
      } else {
        await budgetService.createBudget(input, token);
      }
      resetForm();
      await loadBudgets();
    } catch (error: any) {
      Alert.alert('Lỗi', error.message || 'Không thể lưu ngân sách');
    } finally {
      setSaving(false);
    }
  }

  async function deleteBudget(id: string) {
    try {
      await budgetService.deleteBudget(id, token);
      await loadBudgets();
    } catch (error: any) {
      Alert.alert('Lỗi', error.message || 'Không thể xóa ngân sách');
    }
  }

  return (
    <AppScreen scrollable>
      <AppHeader title="Ngân sách" subtitle="Theo dõi hạn mức chi tiêu tháng này" back />

      <View style={styles.formCard}>
        <Text style={styles.sectionTitle}>{editingId ? 'Sửa ngân sách' : 'Thêm ngân sách'}</Text>
        <TextInput value={name} onChangeText={setName} placeholder="Tên ngân sách" style={styles.input} />
        <TextInput
          value={amount}
          onChangeText={(value) => setAmount(formatCurrencyInput(value))}
          keyboardType="numeric"
          placeholder="Số tiền"
          style={[styles.input, styles.amountInput]}
        />
        <View style={styles.categoryWrap}>
          <Pressable
            onPress={() => setCategoryId(null)}
            style={[styles.categoryChip, categoryId === null && styles.categoryChipActive]}>
            <Text style={styles.categoryText}>Tổng</Text>
          </Pressable>
          {expenseCategories.map((item) => (
            <Pressable
              key={item.id}
              onPress={() => setCategoryId(item.id)}
              style={[styles.categoryChip, categoryId === item.id && styles.categoryChipActive]}>
              <Text style={styles.categoryText}>{item.icon} {item.name}</Text>
            </Pressable>
          ))}
        </View>
        <TextInput value={threshold} onChangeText={setThreshold} keyboardType="numeric" placeholder="Ngưỡng cảnh báo %" style={styles.input} />
        <PrimaryButton label={editingId ? 'Lưu thay đổi' : 'Tạo ngân sách'} onPress={saveBudget} loading={saving} />
        {editingId ? <SecondaryButton label="Hủy sửa" onPress={resetForm} /> : null}
      </View>

      {loading ? (
        <ActivityIndicator color={colors.primaryDark} style={{ marginTop: spacing.xl }} />
      ) : (
        <View style={styles.list}>
          {budgets.map((item) => {
            const category = categories.find((value) => value.id === item.categoryId);
            const spent = item.categoryId
              ? report?.categoryBreakdown.find((value) => value.categoryId === item.categoryId)?.amount ?? 0
              : report?.totalExpense ?? 0;
            const percent = item.amount > 0 ? Math.min(100, Math.round((spent / item.amount) * 100)) : 0;
            return (
              <View key={item.id} style={styles.budgetItem}>
                <View style={styles.itemHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.itemTitle}>{category?.icon} {item.name}</Text>
                    <Text style={styles.itemSub}>{formatCompactCurrency(spent)} / {formatCompactCurrency(item.amount)}</Text>
                  </View>
                  <Pressable onPress={() => startEdit(item)} style={styles.iconButton}>
                    <Ionicons name="create-outline" size={18} color={colors.textPrimary} />
                  </Pressable>
                  <Pressable onPress={() => deleteBudget(item.id)} style={styles.iconButton}>
                    <Ionicons name="trash-outline" size={18} color={colors.error} />
                  </Pressable>
                </View>
                <View style={styles.progressTrack}>
                  <View style={[styles.progressFill, { width: `${percent}%`, backgroundColor: percent >= item.alertThresholdPercent ? colors.accentYellow : colors.primaryDark }]} />
                </View>
              </View>
            );
          })}
        </View>
      )}
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  formCard: {
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.xl,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.divider,
    ...shadows.card,
  },
  sectionTitle: { fontSize: 18, fontWeight: '900', color: colors.textPrimary },
  input: {
    height: 52,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    color: colors.textPrimary,
    backgroundColor: colors.white,
  },
  amountInput: { fontSize: 22, fontWeight: '800' },
  categoryWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  categoryChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  categoryChipActive: { borderColor: colors.primaryDark, backgroundColor: colors.primarySoft },
  categoryText: { color: colors.textPrimary, fontWeight: '700' },
  list: { gap: spacing.md, marginTop: spacing.lg, paddingBottom: 40 },
  budgetItem: {
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.divider,
    backgroundColor: colors.surfaceWarm,
  },
  itemHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  itemTitle: { fontSize: 16, fontWeight: '800', color: colors.textPrimary },
  itemSub: { marginTop: 2, color: colors.textSecondary, fontWeight: '600' },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
  },
  progressTrack: { height: 10, borderRadius: radius.pill, overflow: 'hidden', backgroundColor: colors.divider },
  progressFill: { height: '100%' },
});
