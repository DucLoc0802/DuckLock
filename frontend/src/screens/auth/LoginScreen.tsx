import { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { Href, router } from 'expo-router';

import { AppScreen } from '@/components/ui/AppScreen';
import { PiggyLogo } from '@/components/ui/PiggyLogo';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { SecondaryButton } from '@/components/ui/SecondaryButton';
import { useAppStore } from '@/src/store/app-store';
import { colors, radius, spacing } from '@/src/theme/tokens';

export function LoginScreen() {
  const { login, authState } = useAppStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  async function onSubmit() {
    try {
      setError('');
      // HỌC TẬP: Gọi hàm login từ global store
      // Hàm login này sẽ gián tiếp gọi API Đăng nhập ở Backend
      await login(email, password);
      router.replace('/(tabs)/home' as Href);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Đăng nhập thất bại');
    }
  }

  return (
    <AppScreen scrollable>
      <View style={{ flex: 1, justifyContent: 'center', paddingTop: 40, gap: spacing.xl }}>
        <PiggyLogo />
        <View>
          <Text style={{ fontSize: 28, fontWeight: '800', color: colors.textPrimary }}>
            Chào mừng trở lại
          </Text>
          <Text style={{ color: colors.textSecondary, marginTop: spacing.sm }}>
            Cùng xem hôm nay tiền đã đi đâu nhé
          </Text>
        </View>

        <View style={{ gap: spacing.md }}>
          <TextInput
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            placeholder="Địa chỉ Email"
            style={inputStyle}
          />
          <TextInput
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholder="Mật khẩu"
            style={inputStyle}
          />
          {error ? <Text style={{ color: colors.error }}>{error}</Text> : null}
        </View>

        <View style={{ gap: spacing.md }}>
          <PrimaryButton label="Đăng nhập" onPress={onSubmit} loading={authState === 'loading'} />
          <SecondaryButton label="Đăng nhập với Google" onPress={() => { }} />
        </View>

        <Pressable onPress={() => router.push('/(auth)/register' as Href)}>
          <Text style={{ color: colors.textSecondary, textAlign: 'center' }}>
            Chưa có tài khoản?{' '}
            <Text style={{ color: colors.primaryDark, fontWeight: '800' }}>Đăng ký</Text>
          </Text>
        </Pressable>
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
  backgroundColor: colors.white,
} as const;
