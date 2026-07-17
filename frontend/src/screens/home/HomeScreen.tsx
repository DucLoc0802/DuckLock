import { Href, router } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { TransactionItem } from '@/components/transaction/TransactionItem';
import { WalletSummary } from '@/components/wallet/WalletSummary';
import { AppHeader } from '@/components/ui/AppHeader';
import { AppScreen } from '@/components/ui/AppScreen';
import { CuteCard } from '@/components/ui/CuteCard';
import { DrawerMenu } from '@/components/ui/DrawerMenu';
import { FloatingActionButton } from '@/components/ui/FloatingActionButton';
import { MonthSwitcher } from '@/components/ui/MonthSwitcher';
import { OfflineBanner } from '@/components/ui/OfflineBanner';
import { StatCard } from '@/components/ui/StatCard';
import { useAppStore } from '@/src/store/app-store';
import { colors, radius, spacing } from '@/src/theme/tokens';
import { formatCompactCurrency, getMonthLabel } from '@/src/utils/format';

export function HomeScreen() {
  const { user, transactions, categories, report, weeklyReport, isOffline } = useAppStore();
  const [drawerVisible, setDrawerVisible] = useState(false);
  const latest = transactions.slice(0, 5);

  const maxWeeklyExpense = Math.max(...(weeklyReport || []), 1);

  return (
    <>
    <AppScreen scrollable>
      <AppHeader
        title={`Xin chào, ${user?.name ?? 'bạn'}`}
        subtitle="Hôm nay Piggy giúp bạn giữ ví gọn hơn"
        onMenuPress={() => setDrawerVisible(true)}
      />
      {isOffline ? <OfflineBanner /> : null}
      
      <WalletSummary />

      <MonthSwitcher label={getMonthLabel()} />

      <LinearGradient
        colors={[colors.primarySoft, '#F9FFF3']}
        style={{
          borderRadius: radius.xl,
          padding: spacing.xl,
          marginTop: spacing.lg,
          gap: spacing.md,
        }}>
        <Text style={{ color: colors.textSecondary }}>Tổng chi tháng này</Text>
        <Text style={{ fontSize: 34, fontWeight: '900', color: colors.textPrimary }}>
          {formatCompactCurrency(report?.totalExpense ?? 0)}
        </Text>
        <View
          style={{
            alignSelf: 'flex-start',
            backgroundColor: colors.accentYellowSoft,
            paddingHorizontal: spacing.md,
            paddingVertical: spacing.sm,
            borderRadius: radius.pill,
          }}>
          <Text style={{ color: colors.textPrimary, fontWeight: '700' }}>
            {report?.compareText ?? 'Đang cập nhật'}
          </Text>
        </View>
      </LinearGradient>

      <View style={{ flexDirection: 'row', gap: spacing.md, marginTop: spacing.lg }}>
        <StatCard label="Tổng chi" value={report?.totalExpense ?? 0} />
        <StatCard label="Tổng thu" value={report?.totalIncome ?? 0} tone="income" />
      </View>

      <CuteCard warm>
        <Text style={{ fontWeight: '800', color: colors.textPrimary, marginBottom: spacing.md }}>
          7 ngày gần đây
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sm, height: 140 }}>
          {(weeklyReport || [0, 0, 0, 0, 0, 0, 0]).map((value, index) => (
            <View key={`${value}-${index}`} style={{ flex: 1, alignItems: 'center', gap: 4 }}>
              <Text style={{ color: colors.textSecondary, fontSize: 10, fontWeight: '700' }}>
                {value > 0 ? `${Math.round(value / 1000)}k` : ''}
              </Text>
              <View
                style={{
                  width: '100%',
                  height: Math.max(12, (value / maxWeeklyExpense) * 80),
                  backgroundColor: index === new Date().getDay() - 1 ? colors.accentYellow : colors.primary,
                  borderRadius: 0,
                }}
              />
              <Text style={{ color: colors.textMuted, fontSize: 12 }}>
                {index === 6 ? 'CN' : `T${index + 2}`}
              </Text>
            </View>
          ))}
        </View>
      </CuteCard>

      <View style={{ marginTop: spacing.xl, marginBottom: 90 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={{ fontSize: 20, fontWeight: '800', color: colors.textPrimary }}>
            Giao dịch gần đây
          </Text>
          <Pressable onPress={() => router.push('/(tabs)/transactions' as Href)}>
            <Text style={{ color: colors.primaryDark, fontWeight: '700' }}>Xem tất cả</Text>
          </Pressable>
        </View>
        <View style={{ marginTop: spacing.md }}>
          {latest.map((item) => (
            <TransactionItem
              key={item.id}
              item={item}
              category={categories.find((category) => category.id === item.categoryId)}
              onPress={() => router.push(`/transaction/${item.id}` as Href)}
            />
          ))}
        </View>
      </View>

      <FloatingActionButton onPress={() => router.push('/add-transaction' as Href)} />
    </AppScreen>
    <DrawerMenu visible={drawerVisible} onClose={() => setDrawerVisible(false)} />
    </>
  );
}
