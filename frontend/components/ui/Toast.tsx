import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, shadows, spacing } from '@/src/theme/tokens';

interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'info';
  onDismiss: () => void;
}

export function Toast({ message, type, onDismiss }: ToastProps) {
  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Animation xuất hiện
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: 0,
        duration: 350,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start();

    // Tự động tắt sau 3.5 giây
    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: -100,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start(() => {
        onDismiss();
      });
    }, 3500);

    return () => clearTimeout(timer);
  }, [message, opacity, translateY]);

  const typeConfig = {
    success: {
      bgColor: '#ECFDF5',
      borderColor: '#10B981',
      textColor: '#065F46',
      icon: 'checkmark-circle' as const,
      iconColor: '#10B981',
    },
    error: {
      bgColor: '#FEF2F2',
      borderColor: '#EF4444',
      textColor: '#991B1B',
      icon: 'alert-circle' as const,
      iconColor: '#EF4444',
    },
    info: {
      bgColor: '#EFF6FF',
      borderColor: '#3B82F6',
      textColor: '#1E40AF',
      icon: 'information-circle' as const,
      iconColor: '#3B82F6',
    },
  };

  const config = typeConfig[type] || typeConfig.info;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY }],
          opacity,
          backgroundColor: config.bgColor,
          borderColor: config.borderColor,
        },
      ]}
    >
      <Ionicons name={config.icon} size={22} color={config.iconColor} />
      <Text style={[styles.text, { color: config.textColor }]}>{message}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 50,
    left: spacing.lg,
    right: spacing.lg,
    zIndex: 9999,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.xl,
    borderWidth: 1.5,
    gap: spacing.md,
    ...shadows.card,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 5,
  },
  text: {
    fontSize: 14,
    fontWeight: '700',
    flex: 1,
    lineHeight: 18,
  },
});
