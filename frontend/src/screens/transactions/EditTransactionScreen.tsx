import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { AppHeader } from '@/components/ui/AppHeader';
import { AppScreen } from '@/components/ui/AppScreen';
import { OfflineBanner } from '@/components/ui/OfflineBanner';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { SecondaryButton } from '@/components/ui/SecondaryButton';
import { useAppStore } from '@/src/store/app-store';
import { colors, radius, spacing } from '@/src/theme/tokens';
import { transactionService } from '@/src/services/transactionService';

export function EditTransactionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { categories, updateTransaction, token, isOffline, syncCategory } = useAppStore();

  const expenseCategories = useMemo(
    () => categories.filter((item) => item.id !== 'salary'),
    [categories],
  );

  const [amount, setAmount] = useState('');
  const [type, setType] = useState<'expense' | 'income'>('expense');
  const [categoryId, setCategoryId] = useState('');
  const [transactionDate, setTransactionDate] = useState('');
  const [note, setNote] = useState('');
  const [imageUri, setImageUri] = useState<string | undefined>(undefined);
  
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  // Thêm state cho việc tạo danh mục mới
  const [newCategoryName, setNewCategoryName] = useState('');
  const [showNewCategoryInput, setShowNewCategoryInput] = useState(false);

  useEffect(() => {
    async function loadDetail() {
      if (!id) return;
      try {
        setFetching(true);
        const data = await transactionService.getTransactionDetail(id, token);
        if (data) {
          setAmount(String(data.amount));
          setType(data.type);
          setCategoryId(data.categoryId);
          setTransactionDate(data.transactionDate ? data.transactionDate.slice(0, 10) : new Date().toISOString().slice(0, 10));
          setNote(data.note || '');
          setImageUri(data.imageUri || undefined);
          if (data.rawCategory) {
            syncCategory(data.rawCategory);
          }
        }
      } catch (error) {
        console.error('Lỗi khi tải chi tiết giao dịch:', error);
        Alert.alert('Lỗi', 'Không thể lấy thông tin giao dịch cần sửa');
        router.back();
      } finally {
        setFetching(false);
      }
    }
    loadDetail();
  }, [id, token]);

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
    if (!amount || Number(amount) <= 0 || !categoryId || !id) {
      Alert.alert('Chưa hợp lệ', 'Hãy nhập số tiền và chọn danh mục');
      return;
    }

    try {
      setLoading(true);
      await updateTransaction(id, {
        amount: Number(amount),
        categoryId,
        type,
        note,
        transactionDate: new Date(transactionDate).toISOString(),
        imageUri,
      });
      Alert.alert('Thành công', 'Đã cập nhật giao dịch thành công.');
      router.back();
    } catch (error: any) {
      Alert.alert('Thất bại', error.message || 'Không thể cập nhật giao dịch');
    } finally {
      setLoading(false);
    }
  }

  if (fetching) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primaryDark} />
        <Text style={styles.loadingText}>Đang tải thông tin giao dịch...</Text>
      </View>
    );
  }

  return (
    <AppScreen scrollable>
      <AppHeader title="Sửa giao dịch" subtitle="Cập nhật thông tin giao dịch của bạn" back />
      {isOffline ? <OfflineBanner /> : null}

      {/* Hiển thị ảnh xem trước nếu có */}
      {imageUri ? (
        <View style={{ position: 'relative', marginBottom: spacing.md }}>
          <Image
            source={{ uri: imageUri }}
            style={{ width: '100%', height: 200, borderRadius: radius.xl }}
            contentFit="cover"
          />
          <TouchableOpacity
            onPress={() => setImageUri(undefined)}
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
        <PrimaryButton label="Lưu thay đổi" onPress={onSave} loading={loading} />
        <SecondaryButton label="Hủy" onPress={() => router.back()} />
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.background,
  },
  loadingText: {
    color: colors.textSecondary,
    fontSize: 15,
  },
});

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
  color: colors.textPrimary,
} as const;
