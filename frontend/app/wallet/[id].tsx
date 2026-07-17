import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { AppScreen } from '@/components/ui/AppScreen';
import { useAppStore } from '@/src/store/app-store';
import { walletService } from '@/src/services/walletService';
import { colors, radius, spacing } from '@/src/theme/tokens';
import { WalletType } from '@/src/types/piggy';
import { formatCurrencyInput, parseCurrencyInput } from '@/src/utils/format';

export default function WalletDetailScreen() {
  const { id, type } = useLocalSearchParams<{ id: string; type?: string }>();
  const { token, loadWallets, showToast } = useAppStore();

  const isNew = id === 'new';
  const walletType = (type as WalletType) || 'BANK';

  const [name, setName] = useState('');
  const [balance, setBalance] = useState('');
  const [interestRate, setInterestRate] = useState('');
  const [currentWalletType, setCurrentWalletType] = useState<WalletType>(walletType);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);

  useEffect(() => {
    async function loadWallet() {
      if (isNew || !id) return;
      try {
        setFetching(true);
        // Lấy thông tin ví từ danh sách ví
        const allWallets = await walletService.listWallets(token);
        const wallet = allWallets.find((w) => w.id === id);
        if (wallet) {
          setName(wallet.name);
          setBalance(formatCurrencyInput(wallet.balance));
          setInterestRate(wallet.interest_rate_percent ? String(wallet.interest_rate_percent) : '');
          setCurrentWalletType(wallet.type);
        }
      } catch (error) {
        console.error('Lỗi khi tải thông tin ví:', error);
      } finally {
        setFetching(false);
      }
    }
    loadWallet();
  }, [id, isNew, token]);

  async function handleSave() {
    if (!name.trim() || !balance.trim()) {
      showToast('Vui lòng điền tên ví và số dư ban đầu', 'error');
      return;
    }

    try {
      setLoading(true);
      if (isNew) {
        await walletService.createWallet(
          {
            name: name.trim(),
            type: walletType,
            balance: parseCurrencyInput(balance),
            interestRatePercent: currentWalletType === 'SAVING' ? Number(interestRate) || 0 : null,
          },
          token
        );
        showToast('Đã tạo tài khoản/ví mới thành công.', 'success');
      } else {
        await walletService.updateWallet(
          id!,
          {
            name: name.trim(),
            balance: parseCurrencyInput(balance),
            type: currentWalletType,
            interestRatePercent: currentWalletType === 'SAVING' ? Number(interestRate) || 0 : null,
          },
          token
        );
        showToast('Đã cập nhật thông tin ví thành công.', 'success');
      }
      await loadWallets();
      router.back();
    } catch (error: any) {
      showToast(error.message || 'Không thể lưu ví', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (isNew || !id) return;
    try {
      setLoading(true);
      await walletService.deleteWallet(id, token);
      await loadWallets();
      showToast('Đã xóa tài khoản/ví.', 'success');
      router.back();
    } catch (error: any) {
      showToast(error.message || 'Không thể xóa ví', 'error');
    } finally {
      setLoading(false);
    }
  }

  if (fetching) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primaryDark} />
        <Text style={styles.loadingText}>Đang tải thông tin tài khoản...</Text>
      </View>
    );
  }

  return (
    <AppScreen>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isNew ? `Thêm ví ${walletType === 'SAVING' ? 'Tiết kiệm' : 'Ngân hàng'}` : 'Chi tiết tài khoản'}
        </Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.formContainer}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Tên tài khoản / Ví</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder={walletType === 'SAVING' ? 'Ví dụ: Sổ heo đất, Tiết kiệm mua nhà...' : 'Ví dụ: Vietcombank, Techcombank...'}
              style={styles.input}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Số tiền / Số dư hiện tại</Text>
            <TextInput
              value={balance}
              onChangeText={(value) => setBalance(formatCurrencyInput(value))}
              keyboardType="numeric"
              placeholder="0"
              style={[styles.input, { fontSize: 22, fontWeight: '800' }]}
            />
          </View>

          {currentWalletType === 'SAVING' ? (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Lãi suất (%/năm)</Text>
              <TextInput
                value={interestRate}
                onChangeText={setInterestRate}
                keyboardType="numeric"
                placeholder="Ví dụ: 6.2"
                style={styles.input}
              />
            </View>
          ) : null}
        </View>

        <TouchableOpacity onPress={handleSave} disabled={loading} style={styles.saveButton}>
          {loading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.saveButtonText}>Lưu thông tin</Text>
          )}
        </TouchableOpacity>
        {!isNew ? (
          <TouchableOpacity onPress={handleDelete} disabled={loading} style={styles.deleteButton}>
            <Text style={styles.deleteButtonText}>Xóa tài khoản</Text>
          </TouchableOpacity>
        ) : null}
      </ScrollView>
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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingTop: 10,
    paddingBottom: 15,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  scrollContent: {
    paddingHorizontal: spacing.md,
    paddingBottom: 40,
    gap: spacing.xl,
  },
  formContainer: {
    gap: spacing.lg,
  },
  inputGroup: {
    gap: spacing.xs,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.white,
    height: 56,
    fontSize: 16,
    color: colors.textPrimary,
  },
  saveButton: {
    backgroundColor: colors.primaryDark,
    height: 54,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.md,
  },
  saveButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '800',
  },
  deleteButton: {
    borderWidth: 1,
    borderColor: colors.error,
    height: 54,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButtonText: {
    color: colors.error,
    fontSize: 16,
    fontWeight: '800',
  },
});
