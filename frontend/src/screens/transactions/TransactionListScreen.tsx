import { Href, router } from 'expo-router';
import { Text, View } from 'react-native';

import { TransactionItem } from '@/components/transaction/TransactionItem';
import { AppHeader } from '@/components/ui/AppHeader';
import { AppScreen } from '@/components/ui/AppScreen';
import { EmptyState } from '@/components/ui/EmptyState';
import { FloatingActionButton } from '@/components/ui/FloatingActionButton';
import { MonthSwitcher } from '@/components/ui/MonthSwitcher';
import { useAppStore } from '@/src/store/app-store';
import { colors, spacing } from '@/src/theme/tokens';
import { formatCompactCurrency, formatDate, getMonthLabel } from '@/src/utils/format';

export function TransactionListScreen() {
  const { transactions, categories } = useAppStore();

  if (transactions.length === 0) {
    return (
      <AppScreen>
        <AppHeader title="Giao dịch" subtitle="Theo dõi mọi dòng tiền di chuyển" />
        <EmptyState
          title="Chưa có giao dịch nào"
          description="Khi bạn thêm giao dịch đầu tiên, Piggy sẽ hiển thị ở đây."
        />
      </AppScreen>
    );
  }

  const expenseTotal = transactions
    .filter((item) => item.type === 'expense')
    .reduce((sum, item) => sum + item.amount, 0);

  return (
    <AppScreen scrollable>
      <AppHeader title="Giao dịch" subtitle="Tất cả khoản chi tiêu trong tháng" />
      <MonthSwitcher label={getMonthLabel()} />
      <Text style={{ color: colors.textSecondary, marginTop: spacing.lg }}>Tổng chi tháng này</Text>
      <Text style={{ fontSize: 30, fontWeight: '900', color: colors.textPrimary, marginTop: spacing.xs }}>
        {formatCompactCurrency(expenseTotal)}
      </Text>

      <View style={{ marginTop: spacing.lg, marginBottom: 90 }}>
        {transactions.map((item) => (
          <View key={item.id}>
            <Text style={{ color: colors.textMuted, marginTop: spacing.sm }}>
              {formatDate(item.transactionDate)}
            </Text>
            <TransactionItem
              item={item}
              category={categories.find((category) => category.id === item.categoryId)}
              onPress={() => router.push(`/transaction/${item.id}` as Href)}
            />
          </View>
        ))}
      </View>

      <FloatingActionButton onPress={() => router.push('/add-transaction' as Href)} />
    </AppScreen>
  );
}
