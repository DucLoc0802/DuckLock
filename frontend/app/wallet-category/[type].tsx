import { Ionicons } from '@expo/vector-icons';
import { Href, router, useLocalSearchParams } from 'expo-router';
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
import { LinearGradient } from 'expo-linear-gradient';

import { AppScreen } from '@/components/ui/AppScreen';
import { useAppStore } from '@/src/store/app-store';
import { walletService } from '@/src/services/walletService';
import { Wallet, WalletInterest, WalletType } from '@/src/types/piggy';
import { colors, radius, shadows, spacing } from '@/src/theme/tokens';
import { formatCompactCurrency } from '@/src/utils/format';

const TYPE_META: Record<WalletType, { title: string; icon: keyof typeof Ionicons.glyphMap; btnLabel: string; gradient: [string, string] }> = {
  BANK: {
    title: 'Tài khoản Ngân hàng',
    icon: 'card-outline',
    btnLabel: 'Thêm tài khoản ngân hàng',
    gradient: ['#60A5FA', '#3B82F6'],
  },
  SAVING: {
    title: 'Sổ Tiết kiệm',
    icon: 'trending-up-outline',
    btnLabel: 'Thêm sổ tiết kiệm mới',
    gradient: ['#FBBF24', '#F59E0B'],
  },
  CASH: {
    title: 'Tiền mặt',
    icon: 'cash-outline',
    btnLabel: 'Thêm ví tiền mặt',
    gradient: ['#34D399', '#10B981'],
  },
  OTHER: {
    title: 'Ví khác',
    icon: 'wallet-outline',
    btnLabel: 'Thêm ví khác',
    gradient: ['#A78BFA', '#8B5CF6'],
  },
};

export default function WalletCategoryScreen() {
  const { type } = useLocalSearchParams<{ type: string }>();
  const { token, refreshData, showToast } = useAppStore();

  const walletType = (type as WalletType) || 'BANK';
  const meta = TYPE_META[walletType] || TYPE_META.OTHER;

  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [interestDetails, setInterestDetails] = useState<WalletInterest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const allWallets = await walletService.listWallets(token);
        const filtered = allWallets.filter((w) => w.type === walletType);
        setWallets(filtered);
        if (walletType === 'SAVING') {
          setInterestDetails(await walletService.calculateInterest(token));
        }
      } catch (error) {
        console.error('Lỗi khi tải danh sách ví:', error);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [token, walletType]);

  const totalBalance = wallets.reduce((sum, w) => sum + w.balance, 0);

  async function collectInterest(walletId: string, period: 'MONTHLY' | 'YEARLY') {
    try {
      const result = await walletService.collectInterest(walletId, period, token);
      showToast(result?.message || 'Đã nhận lãi tiết kiệm', 'success');
      const allWallets = await walletService.listWallets(token);
      setWallets(allWallets.filter((w) => w.type === walletType));
      setInterestDetails(await walletService.calculateInterest(token));
      await refreshData();
    } catch (error: any) {
      showToast(error.message || 'Không thể nhận lãi', 'error');
    }
  }

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primaryDark} />
        <Text style={styles.loadingText}>Đang tải danh sách tài khoản...</Text>
      </View>
    );
  }

  return (
    <AppScreen>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{meta.title}</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <LinearGradient
          colors={meta.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.totalCard}
        >
          <Text style={styles.totalLabel}>Tổng số dư nhóm</Text>
          <Text style={styles.totalAmount}>{formatCompactCurrency(totalBalance)}</Text>
          <Text style={styles.walletCount}>{wallets.length} tài khoản</Text>
        </LinearGradient>

        {walletType === 'SAVING' && interestDetails.length > 0 ? (
          <View style={styles.interestPanel}>
            <Text style={styles.interestTitle}>Lãi tiết kiệm dự kiến</Text>
            {interestDetails.map((item) => (
              <View key={item.walletId} style={styles.interestRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.walletName}>{item.walletName}</Text>
                  <Text style={styles.interestRate}>
                    Mỗi ngày: {formatCompactCurrency(Math.round(item.dailyInterest))}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => collectInterest(item.walletId, 'MONTHLY')}
                  style={styles.collectButton}
                >
                  <Text style={styles.collectButtonText}>Tháng</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => collectInterest(item.walletId, 'YEARLY')}
                  style={styles.collectButton}
                >
                  <Text style={styles.collectButtonText}>Năm</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        ) : null}

        <View style={styles.listContainer}>
          {wallets.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="folder-open-outline" size={48} color={colors.textMuted} />
              <Text style={styles.emptyText}>Chưa có tài khoản nào thuộc nhóm này</Text>
            </View>
          ) : (
            wallets.map((wallet) => (
              <TouchableOpacity
                key={wallet.id}
                onPress={() => router.push(`/wallet/${wallet.id}` as Href)}
                style={styles.walletItem}
              >
                <View style={styles.walletIconCircle}>
                  <Ionicons name={meta.icon} size={20} color={meta.gradient[1]} />
                </View>

                <View style={styles.walletInfo}>
                  <Text style={styles.walletName}>{wallet.name}</Text>
                  {wallet.type === 'SAVING' && wallet.interest_rate_percent ? (
                    <Text style={styles.interestRate}>
                      Lãi suất: +{wallet.interest_rate_percent}%/năm
                    </Text>
                  ) : (
                    <Text style={styles.walletSubText}>Tài khoản hoạt động</Text>
                  )}
                </View>

                <View style={styles.balanceContainer}>
                  <Text style={styles.walletBalance}>
                    {formatCompactCurrency(wallet.balance)}
                  </Text>
                  <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>

        <TouchableOpacity
          onPress={() => router.push(`/wallet/new?type=${walletType}` as Href)}
          style={[styles.addButton, { borderColor: meta.gradient[1] }]}
        >
          <Ionicons name="add-circle-outline" size={20} color={meta.gradient[1]} />
          <Text style={[styles.addButtonText, { color: meta.gradient[1] }]}>
            {meta.btnLabel}
          </Text>
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
  totalCard: {
    borderRadius: radius.xl,
    padding: spacing.xl,
    gap: spacing.xs,
    ...shadows.card,
  },
  totalLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.8)',
  },
  totalAmount: {
    fontSize: 28,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  walletCount: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    fontWeight: '500',
  },
  listContainer: {
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  walletItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: 16,
    gap: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  walletIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  walletInfo: {
    flex: 1,
    gap: 2,
  },
  walletName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  walletSubText: {
    fontSize: 12,
    color: colors.textMuted,
  },
  interestRate: {
    fontSize: 12,
    color: '#F59E0B',
    fontWeight: '600',
  },
  balanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  walletBalance: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  emptyContainer: {
    paddingVertical: 40,
    alignItems: 'center',
    gap: spacing.sm,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: radius.xl,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    gap: spacing.sm,
    backgroundColor: colors.surface,
  },
  addButtonText: {
    fontSize: 15,
    fontWeight: '700',
  },
  interestPanel: {
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.xl,
    backgroundColor: colors.accentYellowSoft,
    borderWidth: 1,
    borderColor: colors.accentYellow,
  },
  interestTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: colors.textPrimary,
  },
  interestRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  collectButton: {
    paddingHorizontal: spacing.md,
    height: 36,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryDark,
  },
  collectButtonText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: '800',
  },
});
