import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Href, router } from 'expo-router';

import { useAppStore } from '@/src/store/app-store';
import { colors, radius, shadows, spacing } from '@/src/theme/tokens';
import { formatCompactCurrency } from '@/src/utils/format';

const CATEGORY_META = {
  CASH: { icon: 'cash-outline' as const, label: 'Tiền mặt', gradient: ['#34D399', '#10B981'] as [string, string] },
  BANK: { icon: 'card-outline' as const, label: 'Ngân hàng', gradient: ['#60A5FA', '#3B82F6'] as [string, string] },
  SAVING: { icon: 'trending-up-outline' as const, label: 'Tiết kiệm', gradient: ['#FBBF24', '#F59E0B'] as [string, string] },
  OTHER: { icon: 'wallet-outline' as const, label: 'Khác', gradient: ['#A78BFA', '#8B5CF6'] as [string, string] },
};

function calculateDailyInterest(balance: number, ratePercent: number): number {
  return Math.round(balance * (ratePercent / 100) / 365);
}

function formatNextInterestDate(createdAtStr?: string | null): string {
  const date = createdAtStr ? new Date(createdAtStr) : new Date();
  const day = isNaN(date.getTime()) ? new Date().getDate() : date.getDate();
  const today = new Date();
  const targetDate = new Date(today.getFullYear(), today.getMonth(), day);
  if (targetDate.getTime() <= today.getTime()) {
    targetDate.setMonth(targetDate.getMonth() + 1);
  }
  const dd = String(targetDate.getDate()).padStart(2, '0');
  const mm = String(targetDate.getMonth() + 1).padStart(2, '0');
  const yy = String(targetDate.getFullYear()).slice(-2);
  return `${dd}/${mm}/${yy}`;
}

function calculateMonthlyInterest(balance: number, ratePercent: number): number {
  return Math.round(balance * (ratePercent / 100) / 12);
}

export function WalletSummary() {
  const { wallets } = useAppStore();

  const totalBalance = wallets.reduce((sum, w) => sum + w.balance, 0);

  const cashWallets = wallets.filter((w) => w.type === 'CASH');
  const bankWallets = wallets.filter((w) => w.type === 'BANK');
  const savingWallets = wallets.filter((w) => w.type === 'SAVING');
  const otherWallets = wallets.filter((w) => w.type === 'OTHER');

  const bankTotal = bankWallets.reduce((sum, w) => sum + w.balance, 0);
  const savingTotal = savingWallets.reduce((sum, w) => sum + w.balance, 0);
  const otherTotal = otherWallets.reduce((sum, w) => sum + w.balance, 0);

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
        <Text style={styles.walletCount}>Các tài khoản đang hoạt động</Text>
      </LinearGradient>

      <View style={styles.walletList}>
        {cashWallets.map((wallet) => (
          <TouchableOpacity
            key={wallet.id}
            onPress={() => router.push(`/wallet/${wallet.id}` as Href)}
            style={styles.walletItem}
          >
            <LinearGradient colors={CATEGORY_META.CASH.gradient} style={styles.walletIcon}>
              <Ionicons name={CATEGORY_META.CASH.icon} size={18} color="#FFFFFF" />
            </LinearGradient>
            <View style={styles.walletInfo}>
              <Text style={styles.walletName} numberOfLines={1}>{wallet.name}</Text>
              <Text style={styles.walletType}>{CATEGORY_META.CASH.label}</Text>
            </View>
            <View style={styles.walletBalanceContainer}>
              <Text style={styles.walletBalance}>{formatCompactCurrency(wallet.balance)}</Text>
              <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
            </View>
          </TouchableOpacity>
        ))}

        <TouchableOpacity
          onPress={() => router.push('/wallet-category/BANK' as Href)}
          style={styles.walletItem}
        >
          <LinearGradient colors={CATEGORY_META.BANK.gradient} style={styles.walletIcon}>
            <Ionicons name={CATEGORY_META.BANK.icon} size={18} color="#FFFFFF" />
          </LinearGradient>
          <View style={styles.walletInfo}>
            <Text style={styles.walletName}>Tài khoản Ngân hàng</Text>
            <Text style={styles.walletType}>{bankWallets.length} tài khoản liên kết</Text>
          </View>
          <View style={styles.walletBalanceContainer}>
            <Text style={styles.walletBalance}>{formatCompactCurrency(bankTotal)}</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
          </View>
        </TouchableOpacity>

        {bankWallets.map((wallet) => (
          <TouchableOpacity
            key={wallet.id}
            onPress={() => router.push(`/wallet/${wallet.id}` as Href)}
            style={[styles.walletItem, styles.childWalletItem]}
          >
            <View style={[styles.childDot, { backgroundColor: CATEGORY_META.BANK.gradient[1] }]} />
            <View style={styles.walletInfo}>
              <Text style={styles.childWalletName} numberOfLines={1}>{wallet.name}</Text>
            </View>
            <View style={styles.walletBalanceContainer}>
              <Text style={styles.childWalletBalance}>{formatCompactCurrency(wallet.balance)}</Text>
              <Ionicons name="chevron-forward" size={15} color={colors.textMuted} />
            </View>
          </TouchableOpacity>
        ))}

        <TouchableOpacity
          onPress={() => router.push('/wallet-category/SAVING' as Href)}
          style={styles.walletItem}
        >
          <LinearGradient colors={CATEGORY_META.SAVING.gradient} style={styles.walletIcon}>
            <Ionicons name={CATEGORY_META.SAVING.icon} size={18} color="#FFFFFF" />
          </LinearGradient>
          <View style={styles.walletInfo}>
            <Text style={styles.walletName}>Sổ Tiết kiệm</Text>
            <Text style={styles.walletType}>{savingWallets.length} sổ tiết kiệm</Text>
          </View>
          <View style={styles.walletBalanceContainer}>
            <Text style={styles.walletBalance}>{formatCompactCurrency(savingTotal)}</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
          </View>
        </TouchableOpacity>

        {savingWallets.map((wallet) => {
          const rate = wallet.interest_rate_percent ?? 0;
          const monthlyInterest = rate > 0 ? calculateMonthlyInterest(wallet.balance, rate) : 0;
          const nextDate = formatNextInterestDate(wallet.created_at);
          return (
            <TouchableOpacity
              key={wallet.id}
              onPress={() => router.push(`/wallet/${wallet.id}` as Href)}
              style={[styles.walletItem, styles.childWalletItem]}
            >
              <View style={[styles.childDot, { backgroundColor: CATEGORY_META.SAVING.gradient[1] }]} />
              <View style={styles.walletInfo}>
                <Text style={styles.childWalletName} numberOfLines={1}>
                  {wallet.name}{rate > 0 ? ` (${rate}%)` : ''}
                </Text>
                {monthlyInterest > 0 ? (
                  <Text style={styles.interestText}>
                    dự kiến nhận {formatCompactCurrency(monthlyInterest)} vào ngày {nextDate}
                  </Text>
                ) : null}
              </View>
              <View style={styles.walletBalanceContainer}>
                <Text style={styles.childWalletBalance}>{formatCompactCurrency(wallet.balance)}</Text>
                <Ionicons name="chevron-forward" size={15} color={colors.textMuted} />
              </View>
            </TouchableOpacity>
          );
        })}

        {otherWallets.length > 0 || otherTotal > 0 ? (
          <TouchableOpacity
            onPress={() => router.push('/wallet-category/OTHER' as Href)}
            style={styles.walletItem}
          >
            <LinearGradient colors={CATEGORY_META.OTHER.gradient} style={styles.walletIcon}>
              <Ionicons name={CATEGORY_META.OTHER.icon} size={18} color="#FFFFFF" />
            </LinearGradient>
            <View style={styles.walletInfo}>
              <Text style={styles.walletName}>Tài khoản khác</Text>
              <Text style={styles.walletType}>{otherWallets.length} ví khác</Text>
            </View>
            <View style={styles.walletBalanceContainer}>
              <Text style={styles.walletBalance}>{formatCompactCurrency(otherTotal)}</Text>
              <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
            </View>
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.md, marginTop: spacing.lg },
  totalCard: { borderRadius: radius.xl, padding: spacing.xl, gap: spacing.sm, ...shadows.card },
  totalHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  totalIconCircle: { width: 36, height: 36, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  totalLabel: { fontSize: 14, fontWeight: '600', color: 'rgba(255,255,255,0.8)' },
  totalAmount: { fontSize: 32, fontWeight: '900', color: '#FFFFFF', letterSpacing: -0.5 },
  walletCount: { fontSize: 13, color: 'rgba(255,255,255,0.6)', fontWeight: '500' },
  walletList: { backgroundColor: colors.white, borderRadius: radius.xl, borderWidth: 1, borderColor: colors.border, overflow: 'hidden', ...shadows.card },
  walletItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg, paddingVertical: 14, gap: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.divider },
  walletIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  walletInfo: { flex: 1, gap: 2 },
  walletName: { fontSize: 15, fontWeight: '700', color: colors.textPrimary },
  walletType: { fontSize: 13, color: colors.textMuted, fontWeight: '500' },
  walletBalanceContainer: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  walletBalance: { fontSize: 15, fontWeight: '800', color: colors.textPrimary },
  childWalletItem: { paddingLeft: spacing.xxl, paddingVertical: 12, backgroundColor: colors.surface },
  childDot: { width: 10, height: 10, borderRadius: 5, marginLeft: spacing.sm },
  childWalletName: { fontSize: 14, fontWeight: '700', color: colors.textPrimary },
  childWalletBalance: { fontSize: 14, fontWeight: '800', color: colors.textPrimary },
  interestText: { fontSize: 12, fontWeight: '600', color: '#F59E0B' },
});