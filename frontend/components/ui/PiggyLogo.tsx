import { LinearGradient } from 'expo-linear-gradient';
import { Text, View } from 'react-native';

import { colors } from '@/src/theme/tokens';

export function PiggyLogo({ compact = false }: { compact?: boolean }) {
  return (
    <View style={{ alignItems: 'center', gap: compact ? 8 : 12 }}>
      <LinearGradient
        colors={[colors.primarySoft, colors.accentYellowSoft]}
        style={{
          width: compact ? 64 : 86,
          height: compact ? 64 : 86,
          borderRadius: compact ? 24 : 30,
          alignItems: 'center',
          justifyContent: 'center',
        }}>
        <Text style={{ fontSize: compact ? 28 : 38 }}>🐷</Text>
      </LinearGradient>
      <View style={{ alignItems: 'center' }}>
        <Text style={{ fontSize: compact ? 22 : 28, fontWeight: '800', color: colors.textPrimary }}>
          Piggy
        </Text>
        <Text style={{ color: colors.textSecondary }}>Ví tiết kiệm gọn gàng hơn</Text>
      </View>
    </View>
  );
}
