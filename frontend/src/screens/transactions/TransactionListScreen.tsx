import { Href, router, useFocusEffect } from 'expo-router';
import { ScrollView, Text, View, RefreshControl } from 'react-native';
import { useState, useCallback } from 'react';

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
  const { transactions, categories, refreshData } = useAppStore();
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    try {
      setRefreshing(true);
      await refreshData();
    } catch (error) {
      console.error('Lỗi khi tải lại giao dịch:', error);
    } finally {
      setRefreshing(false);
    }
  }, [refreshData]);

  useFocusEffect(
    useCallback(() => {
      refreshData();
    }, [])
  );

  if (transactions.length === 0) {
    return (
      <AppScreen scrollable={false}>
        <AppHeader title="Giao dịch" subtitle="Theo dõi mọi dòng tiền di chuyển" />
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[colors.primaryDark]}
            />
          }
        >
          <EmptyState
            title="Chưa có giao dịch nào"
            description="Khi bạn thêm giao dịch đầu tiên, Piggy sẽ hiển thị ở đây."
          />
        </ScrollView>
        <FloatingActionButton onPress={() => router.push('/add-transaction' as Href)} />
      </AppScreen>
    );
  }

  const expenseTotal = transactions
    .filter((item) => item.type === 'expense')
    .reduce((sum, item) => sum + item.amount, 0);

  return (
    <AppScreen scrollable={false}>
      <AppHeader title="Giao dịch" subtitle="Tất cả khoản chi tiêu trong tháng" />
      <MonthSwitcher label={getMonthLabel()} />
      <Text style={{ color: colors.textSecondary, marginTop: spacing.lg }}>Tổng chi tháng này</Text>
      <Text style={{ fontSize: 30, fontWeight: '900', color: colors.textPrimary, marginTop: spacing.xs }}>
        {formatCompactCurrency(expenseTotal)}
      </Text>

      <ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={{ paddingBottom: 120 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[colors.primaryDark]}
          />
        }
      >
        <View style={{ marginTop: spacing.lg }}>
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
      </ScrollView>

      <FloatingActionButton onPress={() => router.push('/add-transaction' as Href)} />
    </AppScreen>
  );
}
