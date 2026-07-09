import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors, radius, spacing } from '@/src/theme/tokens';

interface MonthSwitcherProps {
  label: string;
}

export function MonthSwitcher({ label }: MonthSwitcherProps) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: colors.surface,
        borderRadius: radius.pill,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
      }}>
      <Pressable style={{ padding: spacing.xs }}>
        <Ionicons name="chevron-back" size={18} color={colors.textSecondary} />
      </Pressable>
      <Text style={{ fontWeight: '700', color: colors.textPrimary }}>{label}</Text>
      <Pressable style={{ padding: spacing.xs }}>
        <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
      </Pressable>
    </View>
  );
}
