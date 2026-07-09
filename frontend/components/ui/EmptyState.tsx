import { Text, View } from 'react-native';

import { colors, spacing } from '@/src/theme/tokens';

export function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.xxl }}>
      <Text style={{ fontSize: 40 }}>🐷</Text>
      <Text style={{ fontSize: 18, fontWeight: '800', color: colors.textPrimary, marginTop: spacing.sm }}>
        {title}
      </Text>
      <Text style={{ color: colors.textSecondary, textAlign: 'center', marginTop: spacing.xs }}>
        {description}
      </Text>
    </View>
  );
}
