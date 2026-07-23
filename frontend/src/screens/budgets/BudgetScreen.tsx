import { Ionicons } from '@expo/vector-icons';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View, RefreshControl } from 'react-native';
import { Href, router, useFocusEffect } from 'expo-router';

import { AppHeader } from '@/components/ui/AppHeader';
import { AppScreen } from '@/components/ui/AppScreen';
import { FloatingActionButton } from '@/components/ui/FloatingActionButton';
import { budgetService } from '@/src/services/budgetService';
import { useAppStore } from '@/src/store/app-store';
import { Budget } from '@/src/types/piggy';
import { colors, radius, spacing } from '@/src/theme/tokens';
import { formatCompactCurrency } from '@/src/utils/format';

export function BudgetScreen() {
  const { token, categories, showToast, transactions } = useAppStore();
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadBudgets = useCallback(async () => {
    try {
      setLoading(true);
      setBudgets(await budgetService.listBudgets(token));
    } catch (error: any) {
      showToast(error.message || 'Không thể tải ngân sách', 'error');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      loadBudgets();
    }, [])
  );

  const handleRefresh = useCallback(async () => {
    try {
      setRefreshing(true);
      setBudgets(await budgetService.listBudgets(token));
    } catch (error: any) {
      showToast(error.message || 'Không thể tải ngân sách', 'error');
    } finally {
      setRefreshing(false);
    }
  }, [token]);

  async function handleDelete(id: string) {
    Alert.alert(
      'Xác nhận xóa',
      'Bạn có chắc chắn muốn xóa ngân sách này?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await budgetService.deleteBudget(id, token);
              showToast('Đã xóa ngân sách thành công.', 'success');
              await loadBudgets();
            } catch (error: any) {
              showToast(error.message || 'Không thể xóa ngân sách', 'error');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  }

  return (
    <AppScreen scrollable={false}>
      <AppHeader title="Ngân sách" subtitle="Theo dõi hạn mức chi tiêu tháng này" back />

      {loading && budgets.length === 0 ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primaryDark} />
        </View>
      ) : (
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
          {budgets.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="pie-chart-outline" size={80} color={colors.textMuted} />
              <Text style={styles.emptyText}>Chưa có thiết lập hạn mức nào.</Text>
              <Text style={styles.emptySub}>Bấm nút "+" bên dưới để tạo hạn mức chi tiêu đầu tiên.</Text>
            </View>
          ) : (
            <View style={styles.list}>
              {budgets.map((item) => {
                const category = categories.find((value) => value.id === item.categoryId);
                
                // Tự tính spent chỉ dựa trên các giao dịch phát sinh kể từ ngày tạo ngân sách trở đi
                const spent = (() => {
                  const budgetMonthStr = item.budgetMonth.slice(0, 7);
                  const budgetCreatedDateStr = item.createdAt ? item.createdAt.slice(0, 10) : '1970-01-01';
                  
                  const getCatName = (catId: string): string => {
                    const found = categories.find(c => c.id === catId);
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
                    return defaultNames[catId] || 'Khác';
                  };

                  return transactions
                    .filter((tx) => {
                      if (tx.type !== 'expense') return false;
                      if (tx.transactionDate.slice(0, 7) !== budgetMonthStr) return false;
                      
                      // So sánh danh mục theo TÊN để tránh lệch ID tĩnh (local) và UUID (server)
                      if (item.categoryId) {
                        const budgetCatName = getCatName(item.categoryId);
                        const txCatName = getCatName(tx.categoryId);
                        if (budgetCatName !== txCatName) return false;
                      }
                      
                      return tx.transactionDate.slice(0, 10) >= budgetCreatedDateStr;
                    })
                    .reduce((sum, tx) => sum + tx.amount, 0);
                })();
                const percent = item.amount > 0 ? Math.min(100, Math.round((spent / item.amount) * 100)) : 0;
                return (
                  <View key={item.id} style={styles.budgetItem}>
                    <View style={styles.itemHeader}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.itemTitle}>{category?.icon || '📊'} {item.name}</Text>
                        <Text style={styles.itemSub}>{formatCompactCurrency(spent)} / {formatCompactCurrency(item.amount)}</Text>
                      </View>
                      
                      <Pressable 
                        onPress={() => router.push({ pathname: '/add-budget', params: { id: item.id } } as any)} 
                        style={styles.iconButton}
                      >
                        <Ionicons name="create-outline" size={18} color={colors.primaryDark} />
                      </Pressable>
                      
                      <Pressable onPress={() => handleDelete(item.id)} style={styles.iconButton}>
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
        </ScrollView>
      )}

      <FloatingActionButton onPress={() => router.push('/add-budget' as Href)} />
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
    marginTop: 60,
    gap: spacing.md,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textSecondary,
    textAlign: 'center',
  },
  emptySub: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
  },
  list: { 
    gap: spacing.md, 
    marginTop: spacing.md, 
  },
  budgetItem: {
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.divider,
    backgroundColor: colors.white,
  },
  itemHeader: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: spacing.sm,
  },
  itemTitle: { 
    fontSize: 16, 
    fontWeight: '800', 
    color: colors.textPrimary,
  },
  itemSub: { 
    marginTop: 2, 
    color: colors.textSecondary, 
    fontWeight: '600',
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  progressTrack: { 
    height: 8, 
    borderRadius: radius.pill, 
    overflow: 'hidden', 
    backgroundColor: colors.divider,
  },
  progressFill: { 
    height: '100%',
  },
});
