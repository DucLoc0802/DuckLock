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
          height: 62,
          borderRadius: radius.pill,
          backgroundColor: colors.primaryDark,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
          paddingHorizontal: 20,
        },
        shadows.fab,
      ]}>
      <Ionicons name="add" size={22} color={colors.white} />
      <Text style={{ color: colors.white, fontWeight: '800' }}>Thêm</Text>
    </Pressable>
  );
}
