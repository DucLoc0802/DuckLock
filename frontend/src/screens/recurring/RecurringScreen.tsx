import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { AppHeader } from '@/components/ui/AppHeader';
import { AppScreen } from '@/components/ui/AppScreen';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { SecondaryButton } from '@/components/ui/SecondaryButton';
import { recurringService } from '@/src/services/recurringService';
import { useAppStore } from '@/src/store/app-store';
import { BackendTransactionType, RecurringFrequency, RecurringTransaction } from '@/src/types/piggy';
import { colors, radius, shadows, spacing } from '@/src/theme/tokens';
import { formatCompactCurrency, formatCurrencyInput, parseCurrencyInput } from '@/src/utils/format';

const today = new Date().toISOString().slice(0, 10);
const frequencies: RecurringFrequency[] = ['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY'];

export function RecurringScreen() {
  const { token, wallets, categories, refreshData } = useAppStore();
  const [items, setItems] = useState<RecurringTransaction[]>([]);
  const [dueItems, setDueItems] = useState<RecurringTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<BackendTransactionType>('EXPENSE');
  const [frequency, setFrequency] = useState<RecurringFrequency>('MONTHLY');
  const [dayOfPeriod, setDayOfPeriod] = useState('1');
  const [startDate, setStartDate] = useState(today);
  const [nextExecutionDate, setNextExecutionDate] = useState(today);
  const [walletId, setWalletId] = useState('');
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [description, setDescription] = useState('');

  const expenseCategories = useMemo(() => categories.filter((item) => item.id !== 'salary'), [categories]);
  const visibleCategories = useMemo(
    () => (type === 'INCOME' ? categories.filter((item) => item.id === 'salary') : expenseCategories),
    [categories, expenseCategories, type],
  );

  const loadRecurring = useCallback(async () => {
    try {
      setLoading(true);
      const [all, due] = await Promise.all([
        recurringService.listRecurringTransactions(token),
        recurringService.getDue(token),
      ]);
      setItems(all);
      setDueItems(due);
    } catch (error: any) {
      Alert.alert('Lỗi', error.message || 'Không thể tải giao dịch định kỳ');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadRecurring();
  }, [loadRecurring]);

  useEffect(() => {
    if (!walletId && wallets[0]) setWalletId(wallets[0].id);
  }, [walletId, wallets]);

  useEffect(() => {
    setCategoryId(visibleCategories[0]?.id ?? null);
  }, [type, visibleCategories]);

  function resetForm() {
    setEditingId(null);
    setName('');
    setAmount('');
    setType('EXPENSE');
    setFrequency('MONTHLY');
    setDayOfPeriod('1');
    setStartDate(today);
    setNextExecutionDate(today);
    setCategoryId(visibleCategories[0]?.id ?? null);
    setDescription('');
  }

  function startEdit(item: RecurringTransaction) {
    setEditingId(item.id);
    setName(item.name);
    setAmount(formatCurrencyInput(item.amount));
    setType(item.type);
    setFrequency(item.frequency);
    setDayOfPeriod(String(item.dayOfPeriod));
    setStartDate(item.startDate?.slice(0, 10) || today);
    setNextExecutionDate(item.nextExecutionDate?.slice(0, 10) || today);
    setWalletId(item.walletId);
    setCategoryId(item.categoryId);
    setDescription(item.description || '');
  }

  async function saveRecurring() {
    const parsedAmount = parseCurrencyInput(amount);
    if (!walletId || !name.trim() || parsedAmount <= 0) {
      Alert.alert('Chưa hợp lệ', 'Vui lòng nhập tên, số tiền và ví thanh toán');
      return;
    }

    try {
      setSaving(true);
      const input = {
        walletId,
        categoryId,
        name: name.trim(),
        amount: parsedAmount,
        type,
        description: description || null,
        frequency,
        dayOfPeriod: Number(dayOfPeriod) || 1,
        startDate,
        nextExecutionDate,
      };
      if (editingId) {
        await recurringService.updateRecurringTransaction(editingId, input, token);
      } else {
        await recurringService.createRecurringTransaction(input, token);
      }
      resetForm();
      await loadRecurring();
    } catch (error: any) {
      Alert.alert('Lỗi', error.message || 'Không thể lưu giao dịch định kỳ');
    } finally {
      setSaving(false);
    }
  }

  async function confirmDue(id: string) {
    try {
      await recurringService.confirmDue(id, token);
      await Promise.all([loadRecurring(), refreshData()]);
    } catch (error: any) {
      Alert.alert('Lỗi', error.message || 'Không thể xác nhận giao dịch');
    }
  }

  async function deleteRecurring(id: string) {
    try {
      await recurringService.deleteRecurringTransaction(id, token);
      await loadRecurring();
    } catch (error: any) {
      Alert.alert('Lỗi', error.message || 'Không thể xóa giao dịch định kỳ');
    }
  }

  return (
    <AppScreen scrollable>
      <AppHeader title="Giao dịch định kỳ" subtitle="Quản lý khoản lặp lại và khoản đến hạn" back />

      {dueItems.length > 0 ? (
        <View style={styles.dueCard}>
          <Text style={styles.sectionTitle}>Đến hạn</Text>
          {dueItems.map((item) => (
            <View key={item.id} style={styles.dueRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.itemTitle}>{item.name}</Text>
                <Text style={styles.itemSub}>{formatCompactCurrency(item.amount)} • {item.nextExecutionDate?.slice(0, 10)}</Text>
              </View>
              <Pressable onPress={() => confirmDue(item.id)} style={styles.confirmButton}>
                <Ionicons name="checkmark" size={18} color={colors.white} />
              </Pressable>
            </View>
          ))}
        </View>
      ) : null}

      <View style={styles.formCard}>
        <Text style={styles.sectionTitle}>{editingId ? 'Sửa giao dịch' : 'Thêm giao dịch định kỳ'}</Text>
        <TextInput value={name} onChangeText={setName} placeholder="Tên giao dịch" style={styles.input} />
        <TextInput value={amount} onChangeText={(value) => setAmount(formatCurrencyInput(value))} keyboardType="numeric" placeholder="Số tiền" style={[styles.input, styles.amountInput]} />
        <View style={styles.chipWrap}>
          {(['EXPENSE', 'INCOME'] as BackendTransactionType[]).map((value) => (
            <Pressable key={value} onPress={() => setType(value)} style={[styles.chip, type === value && styles.chipActive]}>
              <Text style={styles.chipText}>{value === 'EXPENSE' ? 'Chi tiêu' : 'Thu nhập'}</Text>
            </Pressable>
          ))}
        </View>
        <View style={styles.chipWrap}>
          {wallets.map((wallet) => (
            <Pressable key={wallet.id} onPress={() => setWalletId(wallet.id)} style={[styles.chip, walletId === wallet.id && styles.chipActive]}>
              <Text style={styles.chipText}>{wallet.name}</Text>
            </Pressable>
          ))}
        </View>
        <View style={styles.chipWrap}>
          {visibleCategories.map((item) => (
            <Pressable key={item.id} onPress={() => setCategoryId(item.id)} style={[styles.chip, categoryId === item.id && styles.chipActive]}>
              <Text style={styles.chipText}>{item.icon} {item.name}</Text>
            </Pressable>
          ))}
        </View>
        <View style={styles.chipWrap}>
          {frequencies.map((value) => (
            <Pressable key={value} onPress={() => setFrequency(value)} style={[styles.chip, frequency === value && styles.chipActive]}>
              <Text style={styles.chipText}>{value}</Text>
            </Pressable>
          ))}
        </View>
        <TextInput value={dayOfPeriod} onChangeText={setDayOfPeriod} keyboardType="numeric" placeholder="Ngày trong chu kỳ" style={styles.input} />
        <TextInput value={startDate} onChangeText={setStartDate} placeholder="Ngày bắt đầu YYYY-MM-DD" style={styles.input} />
        <TextInput value={nextExecutionDate} onChangeText={setNextExecutionDate} placeholder="Lần chạy tiếp theo YYYY-MM-DD" style={styles.input} />
        <TextInput value={description} onChangeText={setDescription} placeholder="Ghi chú" style={styles.input} />
        <PrimaryButton label={editingId ? 'Lưu thay đổi' : 'Tạo giao dịch định kỳ'} onPress={saveRecurring} loading={saving} />
        {editingId ? <SecondaryButton label="Hủy sửa" onPress={resetForm} /> : null}
      </View>

      {loading ? (
        <ActivityIndicator color={colors.primaryDark} style={{ marginTop: spacing.xl }} />
      ) : (
        <View style={styles.list}>
          {items.map((item) => (
            <View key={item.id} style={styles.itemCard}>
              <View style={{ flex: 1 }}>
                <Text style={styles.itemTitle}>{item.name}</Text>
                <Text style={styles.itemSub}>{formatCompactCurrency(item.amount)} • {item.frequency} • {item.nextExecutionDate?.slice(0, 10)}</Text>
              </View>
              <Pressable onPress={() => startEdit(item)} style={styles.iconButton}>
                <Ionicons name="create-outline" size={18} color={colors.textPrimary} />
              </Pressable>
              <Pressable onPress={() => deleteRecurring(item.id)} style={styles.iconButton}>
                <Ionicons name="trash-outline" size={18} color={colors.error} />
              </Pressable>
            </View>
          ))}
        </View>
      )}
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  dueCard: {
    gap: spacing.md,
    marginBottom: spacing.lg,
    padding: spacing.lg,
    borderRadius: radius.xl,
    backgroundColor: colors.accentYellowSoft,
    borderWidth: 1,
    borderColor: colors.accentYellow,
  },
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
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipActive: { borderColor: colors.primaryDark, backgroundColor: colors.primarySoft },
  chipText: { color: colors.textPrimary, fontWeight: '700' },
  list: { gap: spacing.md, marginTop: spacing.lg, paddingBottom: 40 },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.lg,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.divider,
    backgroundColor: colors.surfaceWarm,
  },
  dueRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  itemTitle: { color: colors.textPrimary, fontSize: 16, fontWeight: '800' },
  itemSub: { marginTop: 2, color: colors.textSecondary, fontWeight: '600' },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
  },
  confirmButton: {
    width: 38,
    height: 38,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryDark,
  },
});
