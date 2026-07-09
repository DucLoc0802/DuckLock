import { ActivityIndicator, Pressable, Text } from 'react-native';

import { colors, radius } from '@/src/theme/tokens';

interface PrimaryButtonProps {
  label: string;
  onPress: () => void;
  loading?: boolean;
}

export function PrimaryButton({ label, onPress, loading }: PrimaryButtonProps) {
  return (
    <Pressable
      disabled={loading}
      onPress={onPress}
      style={({ pressed }) => ({
        backgroundColor: colors.primaryDark,
        opacity: pressed || loading ? 0.9 : 1,
        height: 54,
        borderRadius: radius.pill,
        alignItems: 'center',
        justifyContent: 'center',
      })}>
      {loading ? (
        <ActivityIndicator color={colors.white} />
      ) : (
        <Text style={{ color: colors.white, fontWeight: '800', fontSize: 16 }}>{label}</Text>
      )}
    </Pressable>
  );
}
