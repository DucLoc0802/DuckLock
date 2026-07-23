import { Pressable, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors, radius, shadows } from '@/src/theme/tokens';

export function FloatingActionButton({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        {
          position: 'absolute',
          right: 20,
          bottom: 28,
          width: 56,
          height: 56,
          borderRadius: 28,
          backgroundColor: colors.primaryDark,
          alignItems: 'center',
          justifyContent: 'center',
        },
        shadows.fab,
      ]}>
      <Ionicons name="add" size={26} color={colors.white} />
    </Pressable>
  );
}
