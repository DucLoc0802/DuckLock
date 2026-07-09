import { Text, View } from 'react-native';

import { colors, radius, spacing } from '@/src/theme/tokens';
import { formatCompactCurrency } from '@/src/utils/format';

interface StatCardProps {
  label: string;
  value: number;
  tone?: 'expense' | 'income';
}

export function StatCard({ label, value, tone = 'expense' }: StatCardProps) {
  const toneColor = tone === 'income' ? colors.incomeSoft : colors.primarySoft;
  const textColor = tone === 'income' ? colors.income : colors.textPrimary;

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: toneColor,
        borderRadius: radius.lg,
        padding: spacing.lg,
        gap: spacing.sm,
      }}>
      <Text style={{ color: colors.textSecondary }}>{label}</Text>
      <Text style={{ fontSize: 20, fontWeight: '800', color: textColor }}>
        {formatCompactCurrency(value)}
      </Text>
    </View>
  );
}
