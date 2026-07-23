import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, TextInput, View, TouchableOpacity } from 'react-native';

import { AppHeader } from '@/components/ui/AppHeader';
import { AppScreen } from '@/components/ui/AppScreen';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { SecondaryButton } from '@/components/ui/SecondaryButton';
import { budgetService } from '@/src/services/budgetService';
import { useAppStore } from '@/src/store/app-store';
import { colors, radius, shadows, spacing } from '@/src/theme/tokens';
import { formatCurrencyInput, parseCurrencyInput } from '@/src/utils/format';

const currentMonth = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-01`;

export default function AddBudgetScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { token, categories, showToast, refreshData } = useAppStore();

  const isNew = !id;

  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [threshold, setThreshold] = useState('80');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);

  const expenseCategories = useMemo(() => categories.filter((item) => item.id !== 'salary'), [categories]);

  useEffect(() => {
    async function loadBudgetDetail() {
      if (isNew || !id) return;
      try {
        setFetching(true);
        const allBudgets = await budgetService.listBudgets(token);
        const budget = allBudgets.find((b) => b.id === id);
        if (budget) {
          setName(budget.name);
          setAmount(formatCurrencyInput(budget.amount));
          setCategoryId(budget.categoryId);
          setThreshold(String(budget.alertThresholdPercent || 80));
        }
      } catch (error: any) {
        console.error('Lỗi khi tải chi tiết ngân sách:', error);
        showToast('Không thể tải chi tiết ngân sách cần sửa', 'error');
        if (router.canGoBack()) {
          router.back();
        } else {
          router.replace('/');
        }
      } finally {
        setFetching(false);
      }
    }
    loadBudgetDetail();
  }, [id, isNew, token]);

  async function handleSave() {
    const parsedAmount = parseCurrencyInput(amount);
    if (!name.trim() || parsedAmount <= 0) {
      showToast('Vui lòng nhập tên và số tiền ngân sách', 'error');
      return;
    }

    try {
      setLoading(true);
      const input = {
        name: name.trim(),
        amount: parsedAmount,
        categoryId,
        budgetMonth: currentMonth,
        amountInDefaultCurrency: parsedAmount,
        alertThresholdPercent: Number(threshold) || 80,
      };

      if (isNew) {
        await budgetService.createBudget(input, token);
        showToast('Đã tạo ngân sách chi tiêu mới thành công.', 'success');
      } else {
        await budgetService.updateBudget(id!, input, token);
        showToast('Đã cập nhật ngân sách chi tiêu thành công.', 'success');
      }
      
      // Refresh dữ liệu toàn cục để trang chủ cập nhật báo cáo ngân sách
      await refreshData();
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace('/');
      }
    } catch (error: any) {
      showToast(error.message || 'Không thể lưu ngân sách', 'error');
    } finally {
      setLoading(false);
    }
  }

  if (fetching) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primaryDark} />
        <Text style={styles.loadingText}>Đang tải chi tiết ngân sách...</Text>
      </View>
    );
  }

  return (
    <AppScreen scrollable>
      <AppHeader 
        title={isNew ? 'Thêm ngân sách' : 'Sửa ngân sách'} 
        subtitle="Quản lý chặt chẽ hạn mức chi tiêu tháng" 
        back 
      />

      <View style={styles.formCard}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Tên ngân sách</Text>
          <TextInput 
            value={name} 
            onChangeText={setName} 
            placeholder="Ví dụ: Ăn uống, Mua sắm..." 
            style={styles.input} 
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Số tiền hạn mức</Text>
          <TextInput
            value={amount}
            onChangeText={(value) => setAmount(formatCurrencyInput(value))}
            keyboardType="numeric"
            placeholder="0"
            style={[styles.input, styles.amountInput]}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Áp dụng cho danh mục</Text>
          <View style={styles.categoryWrap}>
            <Pressable
              onPress={() => setCategoryId(null)}
              style={[styles.categoryChip, categoryId === null && styles.categoryChipActive]}>
              <Text style={styles.categoryText}>Tổng chi tiêu chung</Text>
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
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Ngưỡng cảnh báo (%)</Text>
          <TextInput 
            value={threshold} 
            onChangeText={setThreshold} 
            keyboardType="numeric" 
            placeholder="80" 
            style={styles.input} 
          />
          <Text style={styles.helpText}>Piggy sẽ gửi cảnh báo khi bạn chi tiêu vượt quá mức này.</Text>
        </View>

        <View style={{ marginTop: spacing.md, gap: spacing.sm }}>
          <PrimaryButton 
            label={isNew ? 'Tạo ngân sách' : 'Lưu thay đổi'} 
            onPress={handleSave} 
            loading={loading} 
          />
          <SecondaryButton 
            label="Hủy bỏ" 
            onPress={() => {
              if (router.canGoBack()) {
                router.back();
              } else {
                router.replace('/');
              }
            }} 
          />
        </View>
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.background,
  },
  loadingText: {
    color: colors.textSecondary,
    fontSize: 15,
  },
  formCard: {
    gap: spacing.lg,
    padding: spacing.lg,
    borderRadius: radius.xl,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.divider,
    ...shadows.card,
    marginTop: spacing.md,
  },
  inputGroup: {
    gap: spacing.xs,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textSecondary,
    paddingLeft: 2,
  },
  input: {
    height: 52,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    color: colors.textPrimary,
    backgroundColor: colors.white,
  },
  amountInput: { 
    fontSize: 22, 
    fontWeight: '800' 
  },
  categoryWrap: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    gap: spacing.sm,
    marginTop: 4,
  },
  categoryChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  categoryChipActive: { 
    borderColor: colors.primaryDark, 
    backgroundColor: colors.primarySoft 
  },
  categoryText: { 
    color: colors.textPrimary, 
    fontWeight: '700',
    fontSize: 13,
  },
  helpText: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
    paddingLeft: 2,
  },
});
