import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors, radius, spacing } from '@/src/theme/tokens';

export function OfflineBanner() {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        padding: spacing.md,
        backgroundColor: colors.accentYellowSoft,
        borderRadius: radius.lg,
        marginBottom: spacing.lg,
      }}>
      <Ionicons name="cloud-offline-outline" size={18} color={colors.textPrimary} />
      <Text style={{ flex: 1, color: colors.textPrimary }}>
        Đang ngoại tuyến, dữ liệu có thể chưa cập nhật.
      </Text>
    </View>
  );
}
