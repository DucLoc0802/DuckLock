import { Tabs } from 'expo-router';
import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';

import { HapticTab } from '@/components/haptic-tab';
import { colors, radius } from '@/src/theme/tokens';

// Component nút bấm đặc biệt cho tính năng "Thêm" quét hóa đơn chính
function CustomAddTabButton(props: any) {
  const isSelected = props.accessibilityState?.selected;
  
  return (
    <Pressable
      onPress={props.onPress}
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        // Đẩy cao lên một chút so với thanh Bar thông thường để tạo độ nổi
        top: -12, 
      }}
    >
      <View
        style={{
          width: 54,
          height: 54,
          borderRadius: 27,
          backgroundColor: '#10B981', // Màu xanh lá Emerald premium
          alignItems: 'center',
          justifyContent: 'center',
          // Tạo hiệu ứng bóng đổ đẹp mắt cho nút nổi
          shadowColor: '#10B981',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 5,
          elevation: 6, // Bóng đổ trên thiết bị Android
        }}
      >
        <Ionicons name="camera" size={26} color={colors.white} />
      </View>
      <Text
        style={{
          fontSize: 12,
          fontWeight: '700',
          color: isSelected ? colors.primaryDark : colors.textMuted,
          marginTop: 4,
        }}
      >
        Thêm
      </Text>
    </Pressable>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primaryDark,
        tabBarInactiveTintColor: colors.textMuted,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: {
          height: 84,
          borderTopWidth: 0,
          paddingTop: 10,
          paddingBottom: 16,
          backgroundColor: colors.white,
          borderTopLeftRadius: radius.xl,
          borderTopRightRadius: radius.xl,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '700',
        },
      }}>
      <Tabs.Screen
        name="home"
        options={{
          title: 'Trang chủ',
          tabBarIcon: ({ color }) => <Ionicons size={22} name="home" color={color} />,
        }}
      />
      <Tabs.Screen
        name="transactions"
        options={{
          title: 'Giao dịch',
          tabBarIcon: ({ color }) => <Ionicons size={22} name="swap-horizontal" color={color} />,
        }}
      />
      <Tabs.Screen
        name="inbox"
        options={{
          title: 'Thêm',
          // Sử dụng nút bấm nổi tùy chỉnh
          tabBarButton: (props) => <CustomAddTabButton {...props} />,
        }}
      />
      <Tabs.Screen
        name="reports"
        options={{
          title: 'Báo cáo',
          tabBarIcon: ({ color }) => <Ionicons size={22} name="pie-chart" color={color} />,
        }}
      />
      <Tabs.Screen
        name="budget"
        options={{
          title: 'Hạn mức',
          tabBarIcon: ({ color }) => <Ionicons size={22} name="bar-chart-outline" color={color} />,
        }}
      />
    </Tabs>
  );
}
