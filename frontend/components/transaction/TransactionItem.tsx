import { Image } from 'expo-image';
import { Text, View } from 'react-native';

import { colors, radius, spacing } from '@/src/theme/tokens';
import { Category, Transaction } from '@/src/types/piggy';
import { formatCompactCurrency, formatDate } from '@/src/utils/format';

import { Pressable } from 'react-native';

export function TransactionItem({
  item,
  category,
  onPress,
}: {
  item: Transaction;
  category?: Category;
  onPress?: () => void;
}) {
  const isIncome = item.type === 'income';

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [
        {
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.md,
          paddingVertical: spacing.md,
          opacity: pressed ? 0.7 : 1,
        }
      ]}>
      <View
        style={{
          width: 48,
          height: 48,
          borderRadius: 18,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: category?.color ?? colors.primarySoft,
        }}>
        <Text style={{ fontSize: 22 }}>{category?.icon ?? '💸'}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontWeight: '700', color: colors.textPrimary }}>
          {item.note || category?.name}
        </Text>
        <Text style={{ color: colors.textSecondary, marginTop: 2 }}>
          {category?.name} • {formatDate(item.transactionDate)}
        </Text>
      </View>
      {item.imageUri ? (
        <Image
          source={{ uri: item.imageUri }}
          style={{ width: 42, height: 42, borderRadius: radius.md }}
          contentFit="cover"
        />
      ) : null}
      <View style={{ alignItems: 'flex-end', minWidth: 84 }}>
        <Text
          style={{
            fontWeight: '800',
            color: isIncome ? colors.income : colors.expense,
          }}>
          {isIncome ? '+' : '-'} {formatCompactCurrency(item.amount)}
        </Text>
        {item.syncState === 'pending_create' ? (
          <Text style={{ color: colors.textMuted, fontSize: 12, marginTop: 3 }}>Chờ đồng bộ</Text>
        ) : null}
      </View>
    </Pressable>
  );
}
