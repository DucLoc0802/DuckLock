import { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, Text, TextInput, View, TouchableOpacity } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';

import { AppHeader } from '@/components/ui/AppHeader';
import { AppScreen } from '@/components/ui/AppScreen';
import { OfflineBanner } from '@/components/ui/OfflineBanner';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { SecondaryButton } from '@/components/ui/SecondaryButton';
import { useAppStore } from '@/src/store/app-store';
import { colors, radius, spacing } from '@/src/theme/tokens';

export function AddTransactionScreen() {
  const { categories, addTransaction, isOffline, syncCategory, wallets } = useAppStore();
  const { imageUri } = useLocalSearchParams<{ imageUri?: string }>();
  
  const expenseCategories = useMemo(
    () => categories.filter((item) => item.id !== 'salary'),
    [categories],
  );
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<'expense' | 'income'>('expense');
  const [categoryId, setCategoryId] = useState(expenseCategories[0]?.id ?? '');
  const [transactionDate, setTransactionDate] = useState(new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);

  // State cho việc chọn ví
  const [selectedWalletId, setSelectedWalletId] = useState('');

  // Tự động chọn ví đầu tiên nếu có
  useEffect(() => {
    if (wallets.length > 0 && !selectedWalletId) {
      setSelectedWalletId(wallets[0].id);
    }
  }, [wallets, selectedWalletId]);

  // Thêm state cho việc tạo danh mục mới
  const [newCategoryName, setNewCategoryName] = useState('');
  const [showNewCategoryInput, setShowNewCategoryInput] = useState(false);

  function handleSaveNewCategory() {
    if (!newCategoryName.trim()) {
      Alert.alert('Chưa hợp lệ', 'Vui lòng nhập tên danh mục mới');
      return;
    }
    const name = newCategoryName.trim();
    const newCat = {
      id: `cat-${Date.now()}`,
      name,
      icon: '📝',
      color: '#9E9E9E',
      isDefault: false,
    };
    syncCategory(newCat);
    setCategoryId(newCat.id);
    setNewCategoryName('');
    setShowNewCategoryInput(false);
  }

  async function onSave() {
    if (!amount || Number(amount) <= 0 || !categoryId) {
      Alert.alert('Chưa hợp lệ', 'Hãy nhập số tiền và chọn danh mục');
      return;
    }

    if (!selectedWalletId) {
      Alert.alert('Chưa hợp lệ', 'Vui lòng chọn tài khoản hoặc ví thanh toán');
      return;
    }

    try {
      setLoading(true);
      await addTransaction({
        amount: Number(amount),
        categoryId,
        type,
        note,
        transactionDate: new Date(transactionDate).toISOString(),
        walletId: selectedWalletId,
        imageUri, // Truyền đường dẫn ảnh vừa chụp xuống store
      });
      Alert.alert('Thành công', isOffline ? 'Đã lưu và chờ đồng bộ' : 'Đã lưu giao dịch');
      router.back();
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppScreen scrollable>
      <AppHeader title="Thêm giao dịch" subtitle="Nhập nhanh để Piggy ghi nhớ giúp bạn" back />
      {isOffline ? <OfflineBanner /> : null}

      {/* Hiển thị ảnh xem trước nếu được chụp từ Camera truyền sang */}
      {imageUri ? (
        <View style={{ position: 'relative', marginBottom: spacing.md }}>
          <Image
            source={{ uri: imageUri }}
            style={{ width: '100%', height: 200, borderRadius: radius.xl }}
            contentFit="cover"
          />
          {/* Nút bấm hình chữ X để xóa ảnh đính kèm khỏi giao dịch */}
          <TouchableOpacity
            onPress={() => router.setParams({ imageUri: undefined })}
            style={{
              position: 'absolute',
              top: 12,
              right: 12,
              backgroundColor: 'rgba(0,0,0,0.6)',
              padding: 6,
              borderRadius: 20,
            }}
          >
            <Ionicons name="close" size={20} color={colors.white} />
          </TouchableOpacity>
        </View>
      ) : null}

      <View style={{ gap: spacing.lg }}>
        <View>
          <Text style={labelStyle}>Số tiền</Text>
          <TextInput
            keyboardType="numeric"
            value={amount}
            onChangeText={setAmount}
            placeholder="0"
            style={[inputStyle, { fontSize: 28, fontWeight: '800' }]}
          />
        </View>

        {/* BỘ CHỌN TÀI KHOẢN VÍ THANH TOÁN */}
        <View>
          <Text style={labelStyle}>Tài khoản / Ví thanh toán</Text>
          {wallets.length === 0 ? (
            <Text style={{ color: colors.textMuted, fontSize: 13 }}>Đang tải danh sách ví của bạn...</Text>
          ) : (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
              {wallets.map((wallet) => (
                <Pressable
                  key={wallet.id}
                  onPress={() => setSelectedWalletId(wallet.id)}
                  style={{
                    paddingHorizontal: spacing.md,
                    paddingVertical: spacing.sm,
                    borderRadius: radius.pill,
                    backgroundColor: selectedWalletId === wallet.id ? colors.primarySoft : colors.surface,
                    borderWidth: 1,
                    borderColor: selectedWalletId === wallet.id ? colors.primaryDark : colors.border,
                  }}>
                  <Text style={{ fontWeight: '700', color: colors.textPrimary, fontSize: 13 }}>
                    {wallet.type === 'CASH' ? '💵' : wallet.type === 'SAVING' ? '📈' : '💳'} {wallet.name}
                  </Text>
                </Pressable>
              ))}
            </View>
          )}
        </View>

        <View>
          <Text style={labelStyle}>Loại</Text>
          <View style={{ flexDirection: 'row', gap: spacing.md }}>
            {(['expense', 'income'] as const).map((item) => (
              <Pressable
                key={item}
                onPress={() => setType(item)}
                style={{
                  flex: 1,
                  height: 48,
                  borderRadius: radius.pill,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: type === item ? colors.primaryDark : colors.surface,
                }}>
                <Text
                  style={{
                    color: type === item ? colors.white : colors.textPrimary,
                    fontWeight: '800',
                  }}>
                  {item === 'expense' ? 'Chi tiêu' : 'Thu nhập'}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View>
          <Text style={labelStyle}>Danh mục</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
            {(type === 'income' ? categories.filter((item) => item.id === 'salary') : expenseCategories).map(
              (item) => (
                <Pressable
                  key={item.id}
                  onPress={() => setCategoryId(item.id)}
                  style={{
                    paddingHorizontal: spacing.md,
                    paddingVertical: spacing.sm,
                    borderRadius: radius.pill,
                    backgroundColor: categoryId === item.id ? colors.primarySoft : colors.surface,
                    borderWidth: 1,
                    borderColor: categoryId === item.id ? colors.primaryDark : colors.border,
                  }}>
                  <Text style={{ fontWeight: '700', color: colors.textPrimary }}>
                    {item.icon} {item.name}
                  </Text>
                </Pressable>
              ),
            )}

            {/* NÚT THÊM DANH MỤC NHANH */}
            {showNewCategoryInput ? (
              <View style={{ flexDirection: 'row', gap: spacing.sm, width: '100%', marginTop: spacing.xs }}>
                <TextInput
                  value={newCategoryName}
                  onChangeText={setNewCategoryName}
                  placeholder="Tên danh mục mới..."
                  placeholderTextColor={colors.textMuted}
                  style={{
                    flex: 1,
                    borderWidth: 1,
                    borderColor: colors.primaryDark,
                    borderRadius: radius.pill,
                    paddingHorizontal: spacing.md,
                    height: 38,
                    fontSize: 14,
                    color: colors.textPrimary,
                    backgroundColor: colors.white,
                  }}
                />
                <TouchableOpacity
                  onPress={handleSaveNewCategory}
                  style={{
                    backgroundColor: colors.primaryDark,
                    paddingHorizontal: spacing.md,
                    borderRadius: radius.pill,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text style={{ color: colors.white, fontWeight: '700', fontSize: 13 }}>Lưu</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setShowNewCategoryInput(false)}
                  style={{
                    backgroundColor: colors.surfaceWarm,
                    paddingHorizontal: spacing.md,
                    borderRadius: radius.pill,
                    borderWidth: 1,
                    borderColor: colors.border,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text style={{ color: colors.textPrimary, fontWeight: '700', fontSize: 13 }}>Hủy</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <Pressable
                onPress={() => setShowNewCategoryInput(true)}
                style={{
                  paddingHorizontal: spacing.md,
                  paddingVertical: spacing.sm,
                  borderRadius: radius.pill,
                  backgroundColor: colors.surface,
                  borderWidth: 1,
                  borderColor: colors.primaryDark,
                  borderStyle: 'dashed',
                }}>
                <Text style={{ fontWeight: '700', color: colors.primaryDark }}>
                  + Thêm danh mục
                </Text>
              </Pressable>
            )}
          </View>
        </View>

        <View>
          <Text style={labelStyle}>Ngày</Text>
          <TextInput value={transactionDate} onChangeText={setTransactionDate} style={inputStyle} />
        </View>

        <View>
          <Text style={labelStyle}>Ghi chú</Text>
          <TextInput
            value={note}
            onChangeText={setNote}
            placeholder="Ví dụ: Trà sữa, cơm trưa, xăng xe..."
            multiline
            style={[inputStyle, { height: 120, textAlignVertical: 'top', paddingTop: spacing.md }]}
          />
        </View>
      </View>

      <View style={{ gap: spacing.md, marginTop: spacing.xl }}>
        <PrimaryButton label="Lưu giao dịch" onPress={onSave} loading={loading} />
        <SecondaryButton label="Hủy" onPress={() => router.back()} />
      </View>
    </AppScreen>
  );
}

const labelStyle = {
  color: colors.textSecondary,
  marginBottom: spacing.sm,
  fontWeight: '700',
} as const;

const inputStyle = {
  borderWidth: 1,
  borderColor: colors.border,
  borderRadius: radius.lg,
  paddingHorizontal: spacing.lg,
  backgroundColor: colors.white,
  height: 56,
} as const;
