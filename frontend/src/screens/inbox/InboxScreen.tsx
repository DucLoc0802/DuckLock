import { Image } from 'expo-image';
import { Text, View } from 'react-native';

import { AppHeader } from '@/components/ui/AppHeader';
import { AppScreen } from '@/components/ui/AppScreen';
import { EmptyState } from '@/components/ui/EmptyState';
import { useAppStore } from '@/src/store/app-store';
import { colors, radius, spacing } from '@/src/theme/tokens';
import { formatTime } from '@/src/utils/format';

export function InboxScreen() {
  const { proofImages } = useAppStore();

  return (
    <AppScreen scrollable>
      <AppHeader title={`Hàng chờ (${proofImages.length})`} subtitle="Ảnh minh chứng đang chờ xử lý" />
      {proofImages.length === 0 ? (
        <EmptyState title="Không có ảnh nào" description="Khi chụp nhanh, ảnh sẽ xuất hiện tại đây." />
      ) : (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md }}>
          {proofImages.map((item) => (
            <View
              key={item.id}
              style={{
                width: '47%',
                backgroundColor: colors.white,
                borderRadius: radius.xl,
                overflow: 'hidden',
                borderWidth: 1,
                borderColor: colors.divider,
              }}>
              <Image source={{ uri: item.imageUri }} style={{ width: '100%', height: 170 }} contentFit="cover" />
              <View style={{ padding: spacing.md }}>
                <Text style={{ color: colors.textPrimary, fontWeight: '700' }}>Chưa xử lý</Text>
                <Text style={{ color: colors.textSecondary, marginTop: 4 }}>{formatTime(item.capturedAt)}</Text>
              </View>
            </View>
          ))}
        </View>
      )}
    </AppScreen>
  );
}
