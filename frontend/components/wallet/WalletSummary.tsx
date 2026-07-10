import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { useAppStore } from '@/src/store/app-store';
import { walletService } from '@/src/services/walletService';
import { Wallet, WalletType } from '@/src/types/piggy';
import { colors, radius, shadows, spacing } from '@/src/theme/tokens';
import { formatCompactCurrency } from '@/src/utils/format';

const WALLET_META: Record<WalletType, { icon: keyof typeof Ionicons.glyphMap; label: string; gradient: [string, string] }> = {
  CASH: { icon: 'cash-outline', label: 'Tiền mặt', gradient: ['#34D399', '#10B981'] },
  BANK: { icon: 'card-outline', label: 'Ngân hàng', gradient: ['#60A5FA', '#3B82F6'] },
  SAVING: { icon: 'trending-up-outline', label: 'Tiết kiệm', gradient: ['#FBBF24', '#F59E0B'] },
  OTHER: { icon: 'wallet-outline', label: 'Khác', gradient: ['#A78BFA', '#8B5CF6'] },
};

export function WalletSummary() {
  const { token } = useAppStore();
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const data = await walletService.listWallets(token);
      setWallets(data);
      setLoading(false);
    }
    if (token) load();
    else {
      setWallets([]);
      setLoading(false);
    }
  }, [token]);

  const totalBalance = wallets.reduce((sum, w) => sum + w.balance, 0);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color={colors.primaryDark} />
      </View>
    );
  }

  if (wallets.length === 0) return null;

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#065F46', '#047857']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.totalCard}
      >
        <View style={styles.totalHeader}>
          <View style={styles.totalIconCircle}>
            <Ionicons name="wallet" size={20} color="#10B981" />
          </View>
          <Text style={styles.totalLabel}>Tổng số dư</Text>
        </View>
        <Text style={styles.totalAmount}>{formatCompactCurrency(totalBalance)}</Text>
        <Text style={styles.walletCount}>{wallets.length} ví đang hoạt động</Text>
      </LinearGradient>

      <View style={styles.walletList}>
        {wallets.map((wallet) => {
          const meta = WALLET_META[wallet.type] || WALLET_META.OTHER;
          return (
            <View key={wallet.id} style={styles.walletItem}>
              <LinearGradient
                colors={meta.gradient}
                style={styles.walletIcon}
              >
                <Ionicons name={meta.icon} size={18} color="#FFFFFF" />
              </LinearGradient>

              <View style={styles.walletInfo}>
                <Text style={styles.walletName} numberOfLines={1}>{wallet.name}</Text>
                <Text style={styles.walletType}>{meta.label}</Text>
              </View>

              <View style={styles.walletBalanceContainer}>
                <Text style={styles.walletBalance}>
                  {formatCompactCurrency(wallet.balance)}
                </Text>
                {wallet.type === 'SAVING' && wallet.interest_rate_percent ? (
                  <Text style={styles.interestRate}>
                    +{wallet.interest_rate_percent}%/năm
                  </Text>
                ) : null}
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  loadingContainer: {
    paddingVertical: spacing.xl,
    alignItems: 'center',
  },
  totalCard: {
    borderRadius: radius.xl,
    padding: spacing.xl,
    gap: spacing.sm,
    ...shadows.card,
  },
  totalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  totalIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.8)',
  },
  totalAmount: {
    fontSize: 32,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  walletCount: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.6)',
    fontWeight: '500',
  },
  walletList: {
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    ...shadows.card,
  },
  walletItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
    gap: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  walletIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
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
  walletType: {
    fontSize: 13,
    color: colors.textMuted,
    fontWeight: '500',
  },
  walletBalanceContainer: {
    alignItems: 'flex-end',
    gap: 2,
  },
  walletBalance: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  interestRate: {
    fontSize: 11,
    fontWeight: '600',
    color: '#F59E0B',
  },
});
