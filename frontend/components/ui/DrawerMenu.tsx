import { Ionicons } from '@expo/vector-icons';
import { Href, router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, Easing, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radius, shadows, spacing } from '@/src/theme/tokens';

const MENU_ITEMS = [
  { label: 'Ngân sách', subtitle: 'Theo dõi hạn mức tháng', icon: 'pie-chart-outline' as const, href: '/budget' as Href },
  { label: 'Giao dịch định kỳ', subtitle: 'Lương, hóa đơn, tiết kiệm', icon: 'repeat-outline' as const, href: '/recurring' as Href },
  { label: 'Ví & lãi tiết kiệm', subtitle: 'Nhận lãi cho sổ tiết kiệm', icon: 'trending-up-outline' as const, href: '/wallet-category/SAVING' as Href },
];

interface DrawerMenuProps {
  visible: boolean;
  onClose: () => void;
}

export function DrawerMenu({ visible, onClose }: DrawerMenuProps) {
  const [renderDrawer, setRenderDrawer] = useState(visible);
  const translateX = useRef(new Animated.Value(-320)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setRenderDrawer(true);
      Animated.parallel([
        Animated.timing(translateX, {
          toValue: 0,
          duration: 250,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 220,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(translateX, {
          toValue: -320,
          duration: 220,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 200,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
      ]).start(({ finished }) => {
        if (finished) {
          setRenderDrawer(false);
        }
      });
    }
  }, [visible]);

  if (!renderDrawer) return null;

  return (
    <View style={StyleSheet.absoluteFill}>
      <Animated.View style={[styles.overlay, { opacity }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>
      <Animated.View style={[styles.drawer, { transform: [{ translateX }] }]}>
        <View style={styles.header}>
          <View style={styles.logoCircle}>
            <Ionicons name="lock-closed" size={20} color={colors.primaryDark} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>DuckLock</Text>
            <Text style={styles.subtitle}>Công cụ quản lý tài chính</Text>
          </View>
          <Pressable onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={20} color={colors.textPrimary} />
          </Pressable>
        </View>

        <View style={styles.menuList}>
          {MENU_ITEMS.map((item) => (
            <Pressable
              key={item.label}
              onPress={() => {
                onClose();
                router.push(item.href);
              }}
              style={({ pressed }) => [styles.menuItem, pressed && styles.menuItemPressed]}>
              <View style={styles.menuIcon}>
                <Ionicons name={item.icon} size={20} color={colors.primaryDark} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.menuLabel}>{item.label}</Text>
                <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
            </Pressable>
          ))}
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(17, 24, 39, 0.35)',
  },
  drawer: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: Math.min(320, Dimensions.get('window').width * 0.86),
    backgroundColor: colors.background,
    paddingTop: 54,
    paddingHorizontal: spacing.lg,
    borderTopRightRadius: radius.xl,
    borderBottomRightRadius: radius.xl,
    ...shadows.card,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingBottom: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  logoCircle: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.textPrimary,
  },
  subtitle: {
    marginTop: 2,
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: '600',
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  menuList: {
    gap: spacing.sm,
    paddingTop: spacing.lg,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.divider,
  },
  menuItemPressed: {
    backgroundColor: colors.primarySoft,
  },
  menuIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuLabel: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '800',
  },
  menuSubtitle: {
    marginTop: 2,
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
});
