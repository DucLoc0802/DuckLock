import { Href, router, useFocusEffect } from 'expo-router';
import { useState, useCallback } from 'react';
import { Pressable, Text, View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

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
  const { user, transactions, report, weeklyReport, isOffline, refreshData } = useAppStore();
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      await refreshData();
    } finally {
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      refreshData();
    }, [])
  );

  const maxWeeklyExpense = Math.max(...(weeklyReport || []), 1);

  // LOGIC TỰ VẼ WIDGET LỊCH CHI TIÊU THÔNG MINH (CALENDAR TRACKER)
  const getDaysInMonth = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth(); // 0-indexed (0: Tháng 1, 6: Tháng 7...)

    const firstDayIndex = new Date(year, month, 1).getDay(); // Ngày đầu tuần của ngày 1 (0: CN, 1: T2, ...)
    const totalDays = new Date(year, month + 1, 0).getDate(); // Tổng số ngày trong tháng

    const days = [];

    // Điều chỉnh thứ tự: T2 là index 0, T3 là index 1, ..., CN là index 6
    const adjustedFirstDayIndex = firstDayIndex === 0 ? 6 : firstDayIndex - 1;

    // Thêm các ô trống ở đầu (đối với các ngày thuộc tuần trước ngày mùng 1)
    for (let i = 0; i < adjustedFirstDayIndex; i++) {
      days.push(null);
    }

    // Thêm các ngày thực tế của tháng hiện tại
    for (let d = 1; d <= totalDays; d++) {
      days.push(new Date(year, month, d));
    }

    return days;
  };

  const getDayStatus = (date: Date) => {
    // Định dạng yyyy-mm-dd để so khớp
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;

    // Lọc giao dịch phát sinh trong ngày này
    const dayTxs = transactions.filter(t => t.transactionDate.slice(0, 10) === dateStr);

    const hasIncome = dayTxs.some(t => t.type === 'income');
    const hasExpense = dayTxs.some(t => t.type === 'expense');

    return { hasIncome, hasExpense };
  };

  const days = getDaysInMonth();
  const today = new Date();
  const dayNames = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

  return (
    <>
      <AppScreen scrollable refreshing={refreshing} onRefresh={handleRefresh}>
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

        {/* WIDGET LỊCH THEO DÕI TÀI CHÍNH THÁNG */}
        <View style={styles.calendarContainer}>
          <View style={styles.calendarHeader}>
            <Text style={styles.calendarTitle}>Nhật ký chi tiêu</Text>
            <Text style={styles.calendarSubtitle}>Tháng {today.getMonth() + 1}/{today.getFullYear()}</Text>
          </View>

          {/* Hàng tên các thứ trong tuần */}
          <View style={styles.daysHeaderRow}>
            {dayNames.map((name) => (
              <Text key={name} style={styles.dayNameText}>{name}</Text>
            ))}
          </View>

          {/* Lưới các ngày */}
          <View style={styles.daysGrid}>
            {days.map((date, index) => {
              if (!date) {
                return <View key={`empty-${index}`} style={styles.emptyDayCell} />;
              }

              const isToday =
                date.getDate() === today.getDate() &&
                date.getMonth() === today.getMonth() &&
                date.getFullYear() === today.getFullYear();

              const { hasIncome, hasExpense } = getDayStatus(date);

              return (
                <Pressable
                  key={date.toISOString()}
                  onPress={() => {
                    // Khi bấm vào ngày, ta điều hướng sang Tab giao dịch và hiển thị danh sách giao dịch
                    router.push('/(tabs)/transactions' as Href);
                  }}
                  style={[
                    styles.dayCell,
                    isToday && styles.todayCell
                  ]}
                >
                  <Text style={[
                    styles.dayNumberText,
                    isToday && styles.todayDayNumberText
                  ]}>
                    {date.getDate()}
                  </Text>

                  {/* Chấm tròn nhỏ thể hiện hoạt động thu/chi */}
                  <View style={styles.statusDotsContainer}>
                    {hasIncome && <View style={[styles.statusDot, { backgroundColor: colors.income }]} />}
                    {hasExpense && <View style={[styles.statusDot, { backgroundColor: '#EF4444' }]} />}
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>
      </AppScreen>
      <DrawerMenu visible={drawerVisible} onClose={() => setDrawerVisible(false)} />
    </>
  );
}

const styles = StyleSheet.create({
  calendarContainer: {
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    padding: spacing.lg,
    marginTop: spacing.lg,
    marginBottom: 90,
    borderWidth: 1,
    borderColor: colors.border,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  calendarTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  calendarSubtitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textMuted,
  },
  daysHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
    marginBottom: spacing.xs,
  },
  dayNameText: {
    width: '14.28%',
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '700',
    color: colors.textMuted,
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  dayCell: {
    width: '14.28%',
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  emptyDayCell: {
    width: '14.28%',
    height: 48,
  },
  todayCell: {
    backgroundColor: colors.primarySoft,
    borderRadius: radius.md,
  },
  dayNumberText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  todayDayNumberText: {
    color: colors.primaryDark,
    fontWeight: '800',
  },
  statusDotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 3,
    height: 6,
    marginTop: 4,
  },
  statusDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
});
