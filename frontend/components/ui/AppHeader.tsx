import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { colors, spacing } from '@/src/theme/tokens';

interface AppHeaderProps {
  title: string;
  subtitle?: string;
  back?: boolean;
  rightSlot?: React.ReactNode;
  onMenuPress?: () => void;
}

export function AppHeader({ title, subtitle, back, rightSlot, onMenuPress }: AppHeaderProps) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: spacing.lg,
        marginTop: spacing.sm,
      }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, flex: 1 }}>
        {back ? (
          <Pressable
            onPress={() => router.back()}
            style={{
              width: 42,
              height: 42,
              borderRadius: 16,
              backgroundColor: colors.surface,
              alignItems: 'center',
              justifyContent: 'center',
            }}>
            <Ionicons name="chevron-back" size={20} color={colors.textPrimary} />
          </Pressable>
        ) : onMenuPress ? (
          <Pressable
            onPress={onMenuPress}
            style={{
              width: 42,
              height: 42,
              borderRadius: 16,
              backgroundColor: colors.surface,
              alignItems: 'center',
              justifyContent: 'center',
            }}>
            <Ionicons name="menu" size={22} color={colors.textPrimary} />
          </Pressable>
        ) : null}
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 26, fontWeight: '800', color: colors.textPrimary }}>{title}</Text>
          {subtitle ? (
            <Text style={{ color: colors.textSecondary, marginTop: 2 }}>{subtitle}</Text>
          ) : null}
        </View>
      </View>
      {rightSlot}
    </View>
  );
}
