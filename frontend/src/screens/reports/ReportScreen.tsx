import { Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useState, useCallback } from 'react';

import { AppHeader } from '@/components/ui/AppHeader';
import { AppScreen } from '@/components/ui/AppScreen';
import { CuteCard } from '@/components/ui/CuteCard';
import { useAppStore } from '@/src/store/app-store';
import { colors, radius, spacing } from '@/src/theme/tokens';
import { formatCompactCurrency } from '@/src/utils/format';

export function ReportScreen() {
  const { report, categories, refreshData } = useAppStore();
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    try {
      setRefreshing(true);
      await refreshData();
    } catch (error) {
      console.error('Lỗi khi tải lại báo cáo:', error);
    } finally {
      setRefreshing(false);
    }
  }, [refreshData]);

  useFocusEffect(
    useCallback(() => {
      refreshData();
    }, [])
  );

  return (
    <AppScreen scrollable refreshing={refreshing} onRefresh={handleRefresh}>
      <AppHeader title="Báo cáo" subtitle="Piggy tóm tắt tháng này cho bạn" />
      <CuteCard>
        <Text style={{ fontSize: 18, fontWeight: '800', color: colors.textPrimary }}>
          Theo danh mục
        </Text>
        <View style={{ marginTop: spacing.lg, gap: spacing.md }}>
          {report?.categoryBreakdown.map((item) => {
            const category = categories.find((value) => value.id === item.categoryId);
            return (
              <View key={item.categoryId} style={{ gap: spacing.sm }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ color: colors.textPrimary, fontWeight: '700' }}>
                    {category?.icon} {category?.name}
                  </Text>
                  <Text style={{ color: colors.textSecondary }}>
                    {formatCompactCurrency(item.amount)} • {item.percent}%
                  </Text>
                </View>
                <View
                  style={{
                    height: 10,
                    backgroundColor: colors.divider,
                    borderRadius: radius.pill,
                    overflow: 'hidden',
                  }}>
                  <View
                    style={{
                      width: `${item.percent}%`,
                      height: '100%',
                      backgroundColor: item.percent > 30 ? colors.accentYellow : colors.primaryDark,
                    }}
                  />
                </View>
              </View>
            );
          })}
        </View>
      </CuteCard>

      <CuteCard warm>
        <Text style={{ fontSize: 18, fontWeight: '800', color: colors.textPrimary }}>
          Xu hướng 7 ngày
        </Text>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'flex-end',
            gap: spacing.sm,
            height: 200,
            marginTop: spacing.lg,
          }}>
          {(report?.dailySeries ?? []).map((value, index) => (
            <View key={`${value}-${index}`} style={{ flex: 1, alignItems: 'center', gap: 4 }}>
              <Text style={{ color: colors.textSecondary, fontSize: 10, fontWeight: '700' }}>
                {value > 0 ? `${Math.round(value / 1000)}k` : ''}
              </Text>
              <View
                style={{
                  width: '100%',
                  height: Math.max(26, value / 2),
                  backgroundColor: index % 2 === 0 ? colors.primary : colors.accentYellow,
                  borderRadius: 0,
                }}
              />
              <Text style={{ color: colors.textMuted, fontSize: 12 }}>N{index + 1}</Text>
            </View>
          ))}
        </View>
      </CuteCard>
    </AppScreen>
  );
}
