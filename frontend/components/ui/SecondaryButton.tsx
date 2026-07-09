import { Pressable, Text } from 'react-native';

import { colors, radius } from '@/src/theme/tokens';

interface SecondaryButtonProps {
  label: string;
  onPress: () => void;
}

export function SecondaryButton({ label, onPress }: SecondaryButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: pressed ? colors.surface : colors.white,
        height: 54,
        borderRadius: radius.pill,
        alignItems: 'center',
        justifyContent: 'center',
      })}>
      <Text style={{ color: colors.textPrimary, fontWeight: '700', fontSize: 16 }}>{label}</Text>
    </Pressable>
  );
}
