import { Text, View } from 'react-native';

import { AppHeader } from '@/components/ui/AppHeader';
import { AppScreen } from '@/components/ui/AppScreen';
import { CuteCard } from '@/components/ui/CuteCard';
import { useAppStore } from '@/src/store/app-store';
import { colors, radius, spacing } from '@/src/theme/tokens';
import { formatCompactCurrency } from '@/src/utils/format';

export function ReportScreen() {
  const { report, categories } = useAppStore();

  return (
    <AppScreen scrollable>
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
            height: 180,
            marginTop: spacing.lg,
          }}>
          {(report?.dailySeries ?? []).map((value, index) => (
            <View key={`${value}-${index}`} style={{ flex: 1, alignItems: 'center', gap: spacing.sm }}>
              <View
                style={{
                  width: '100%',
                  height: Math.max(26, value / 2),
                  backgroundColor: index % 2 === 0 ? colors.primary : colors.accentYellow,
                  borderRadius: radius.pill,
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
