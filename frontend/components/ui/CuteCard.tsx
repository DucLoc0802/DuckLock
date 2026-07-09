import { ReactNode } from 'react';
import { View } from 'react-native';

import { colors, radius, shadows, spacing } from '@/src/theme/tokens';

export function CuteCard({
  children,
  warm,
}: {
  children: ReactNode;
  warm?: boolean;
}) {
  return (
    <View
      style={[
        {
          backgroundColor: warm ? colors.surfaceWarm : colors.white,
          borderRadius: radius.xl,
          padding: spacing.lg,
          borderWidth: 1,
          borderColor: colors.divider,
        },
        shadows.card,
      ]}>
      {children}
    </View>
  );
}
