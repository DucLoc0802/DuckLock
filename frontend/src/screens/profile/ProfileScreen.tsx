import { Image } from 'expo-image';
import { Alert, Pressable, Text, TextInput, View } from 'react-native';
import { Href, router } from 'expo-router';

import { AppHeader } from '@/components/ui/AppHeader';
import { AppScreen } from '@/components/ui/AppScreen';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { SecondaryButton } from '@/components/ui/SecondaryButton';
import { useAppStore } from '@/src/store/app-store';
import { colors, radius, spacing } from '@/src/theme/tokens';

export function ProfileScreen() {
  const { user, logout, isOffline, toggleOffline } = useAppStore();

  function onLogout() {
    Alert.alert('Đăng xuất', 'Bạn có chắc muốn đăng xuất không?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Đăng xuất',
        style: 'destructive',
        onPress: () => {
          logout();
          router.replace('/(auth)/login' as Href);
        },
      },
    ]);
  }

  return (
    <AppScreen scrollable>
      <AppHeader title="Hồ sơ" subtitle="Cá nhân hóa ví tiền nhỏ của bạn" />
      <View style={{ alignItems: 'center', marginTop: spacing.md }}>
        <Image source={{ uri: user?.avatar }} style={{ width: 96, height: 96, borderRadius: 40 }} />
        <Text style={{ fontSize: 22, fontWeight: '800', color: colors.textPrimary, marginTop: spacing.md }}>
          {user?.name}
        </Text>
        <Text style={{ color: colors.textSecondary, marginTop: spacing.xs }}>{user?.email}</Text>
      </View>

      <View style={{ gap: spacing.md, marginTop: spacing.xl }}>
        <TextInput value={user?.name} editable={false} style={inputStyle} />
        <TextInput value={user?.email} editable={false} style={inputStyle} />
        <TextInput value={user?.defaultCurrency} editable={false} style={inputStyle} />
      </View>

      <Pressable
        onPress={toggleOffline}
        style={{
          marginTop: spacing.xl,
          borderRadius: radius.xl,
          padding: spacing.lg,
          backgroundColor: isOffline ? colors.accentYellowSoft : colors.surface,
        }}>
        <Text style={{ fontWeight: '800', color: colors.textPrimary }}>
          {isOffline ? 'Đang ngoại tuyến' : 'Đang trực tuyến'}
        </Text>
        <Text style={{ color: colors.textSecondary, marginTop: spacing.xs }}>
          Chạm để mô phỏng trạng thái mạng
        </Text>
      </Pressable>

      <View style={{ marginTop: spacing.xl, gap: spacing.md }}>
        <PrimaryButton label="Lưu thay đổi" onPress={() => {}} />
        <SecondaryButton label="Đăng xuất" onPress={onLogout} />
      </View>
    </AppScreen>
  );
}

const inputStyle = {
  height: 56,
  borderRadius: radius.lg,
  borderWidth: 1,
  borderColor: colors.border,
  paddingHorizontal: spacing.lg,
  backgroundColor: colors.surface,
} as const;
