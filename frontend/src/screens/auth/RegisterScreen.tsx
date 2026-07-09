import { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { Href, router } from 'expo-router';

import { AppScreen } from '@/components/ui/AppScreen';
import { PiggyLogo } from '@/components/ui/PiggyLogo';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { useAppStore } from '@/src/store/app-store';
import { colors, radius, spacing } from '@/src/theme/tokens';

export function RegisterScreen() {
  const { register, authState } = useAppStore();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  async function onSubmit() {
    if (password !== confirmPassword) {
      setError('Mật khẩu xác nhận chưa khớp');
      return;
    }

    try {
      setError('');
      await register(name, email, password);
      router.replace('/(tabs)/home' as Href);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Đăng ký thất bại');
    }
  }

  return (
    <AppScreen scrollable>
      <View style={{ flex: 1, paddingTop: 40, gap: spacing.xl }}>
        <PiggyLogo compact />
        <View>
          <Text style={{ fontSize: 28, fontWeight: '800', color: colors.textPrimary }}>
            Tạo tài khoản Piggy
          </Text>
          <Text style={{ color: colors.textSecondary, marginTop: spacing.sm }}>
            Bạn đang ở chế độ mock cho đăng ký, còn đăng nhập đã nối backend thật
          </Text>
        </View>
        <View style={{ gap: spacing.md }}>
          <TextInput value={name} onChangeText={setName} placeholder="Họ tên" style={inputStyle} />
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="Email"
            keyboardType="email-address"
            autoCapitalize="none"
            style={inputStyle}
          />
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="Mật khẩu"
            secureTextEntry
            style={inputStyle}
          />
          <TextInput
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="Xác nhận mật khẩu"
            secureTextEntry
            style={inputStyle}
          />
          {error ? <Text style={{ color: colors.error }}>{error}</Text> : null}
        </View>
        <PrimaryButton
          label="Tạo tài khoản"
          onPress={onSubmit}
          loading={authState === 'loading'}
        />
        <Pressable onPress={() => router.replace('/(auth)/login' as Href)}>
          <Text style={{ color: colors.textSecondary, textAlign: 'center' }}>
            Đã có tài khoản?{' '}
            <Text style={{ color: colors.primaryDark, fontWeight: '800' }}>Đăng nhập</Text>
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
