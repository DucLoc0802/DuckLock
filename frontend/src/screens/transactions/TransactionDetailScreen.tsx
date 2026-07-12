import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { AppHeader } from '@/components/ui/AppHeader';
import { AppScreen } from '@/components/ui/AppScreen';
import { useAppStore } from '@/src/store/app-store';
import { colors, radius, spacing } from '@/src/theme/tokens';
import { formatCompactCurrency, formatDate } from '@/src/utils/format';
import { transactionService } from '@/src/services/transactionService';

export function TransactionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { token, categories, deleteTransaction, syncCategory } = useAppStore();

  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<any>(null);
  const [deleting, setDeleting] = useState(false);

  const category = categories.find((c) => c.id === detail?.categoryId);
  const isIncome = detail?.type === 'income';

  useEffect(() => {
    async function loadDetail() {
      if (!id) return;
      try {
        setLoading(true);
        const data = await transactionService.getTransactionDetail(id, token);
        setDetail(data);
        if (data.rawCategory) {
          syncCategory(data.rawCategory);
        }
      } catch (error) {
        console.error('Lỗi khi tải chi tiết giao dịch:', error);
        Alert.alert('Lỗi', 'Không thể kết nối lấy chi tiết giao dịch.');
      } finally {
        setLoading(false);
      }
    }
    loadDetail();
  }, [id, token]);

  async function handleDelete() {
    Alert.alert(
      'Xác nhận xóa',
      'Bạn có chắc chắn muốn xóa giao dịch này không? Hành động này không thể hoàn tác.',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: async () => {
            try {
              setDeleting(true);
              if (id) {
                await deleteTransaction(id);
                Alert.alert('Thành công', 'Đã xóa giao dịch thành công.');
                router.back();
              }
            } catch (error: any) {
              Alert.alert('Thất bại', error.message || 'Không thể xóa giao dịch');
            } finally {
              setDeleting(false);
            }
          },
        },
      ]
    );
  }

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#10B981" />
        <Text style={styles.loadingText}>Đang tải chi tiết giao dịch...</Text>
      </View>
    );
  }

  if (!detail) {
    return (
      <AppScreen>
        <AppHeader title="Chi tiết" subtitle="Không tìm thấy giao dịch" back />
        <View style={styles.centerContainer}>
          <Text style={{ color: colors.textSecondary }}>Giao dịch không tồn tại hoặc đã bị xóa.</Text>
        </View>
      </AppScreen>
    );
  }

  return (
    <AppScreen>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chi tiết giao dịch</Text>
        <TouchableOpacity
          onPress={() => router.push(`/edit-transaction/${id}` as any)}
          style={styles.backButton}
        >
          <Ionicons name="pencil" size={20} color={colors.primaryDark} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.amountCard}>
          <View
            style={[
              styles.categoryIconCircle,
              { backgroundColor: category?.color ?? colors.primarySoft },
            ]}
          >
            <Text style={{ fontSize: 32 }}>{category?.icon ?? '💸'}</Text>
          </View>

          <Text style={styles.categoryNameText}>{category?.name ?? 'Chưa phân loại'}</Text>
          
          <Text
            style={[
              styles.amountText,
              { color: isIncome ? colors.income : colors.expense },
            ]}
          >
            {isIncome ? '+' : '-'} {formatCompactCurrency(detail.amount)}
          </Text>

          <Text style={styles.dateText}>{formatDate(detail.transactionDate)}</Text>
        </View>

        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>Thông tin chi tiết</Text>
          
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Loại giao dịch</Text>
              <Text style={[styles.infoValue, { fontWeight: '700', color: isIncome ? colors.income : colors.expense }]}>
                {isIncome ? 'Khoản thu (Income)' : 'Khoản chi (Expense)'}
              </Text>
            </View>

            <View style={styles.divider} />

            <View style={[styles.infoRow, { alignItems: 'flex-start' }]}>
              <Text style={styles.infoLabel}>Ghi chú</Text>
              <Text style={[styles.infoValue, { flex: 1, textAlign: 'right' }]}>
                {detail.note || 'Không có ghi chú'}
              </Text>
            </View>
          </View>
        </View>

        {detail.imageUri ? (
          <View style={styles.imageSection}>
            <Text style={styles.sectionTitle}>Ảnh chụp đính kèm</Text>
            <View style={styles.imageWrapper}>
              <Image
                source={{ uri: detail.imageUri }}
                style={styles.attachedImage}
                contentFit="cover"
              />
            </View>
          </View>
        ) : null}

        <TouchableOpacity
          onPress={handleDelete}
          disabled={deleting}
          style={styles.deleteButton}
        >
          {deleting ? (
            <ActivityIndicator size="small" color="#EF4444" />
          ) : (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
              <Ionicons name="trash-outline" size={20} color="#EF4444" />
              <Text style={styles.deleteButtonText}>Xóa giao dịch này</Text>
            </View>
          )}
        </TouchableOpacity>

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
  amountCard: {
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    padding: spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  categoryIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  categoryNameText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  amountText: {
    fontSize: 32,
    fontWeight: '900',
    marginBottom: spacing.sm,
  },
  dateText: {
    fontSize: 14,
    color: colors.textMuted,
  },
  infoSection: {
    gap: spacing.sm,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingLeft: 4,
  },
  infoCard: {
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  infoLabel: {
    color: colors.textSecondary,
    fontSize: 15,
  },
  infoValue: {
    color: colors.textPrimary,
    fontSize: 15,
  },
  divider: {
    height: 1,
    backgroundColor: colors.divider,
    marginVertical: spacing.xs,
  },
  imageSection: {
    gap: spacing.sm,
  },
  imageWrapper: {
    borderRadius: radius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    padding: 6,
  },
  attachedImage: {
    width: '100%',
    height: 250,
    borderRadius: radius.lg,
  },
  deleteButton: {
    flexDirection: 'row',
    backgroundColor: '#FEE2E2',
    borderWidth: 1.5,
    borderColor: '#FCA5A5',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: radius.xl,
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  deleteButtonText: {
    color: '#EF4444',
    fontSize: 16,
    fontWeight: '700',
  },
});
