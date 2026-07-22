import { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleProp, ViewStyle, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors } from '@/src/theme/tokens';

interface AppScreenProps {
  children: ReactNode;
  scrollable?: boolean;
  style?: StyleProp<ViewStyle>;
  refreshing?: boolean;
  onRefresh?: () => void;
}

export function AppScreen({ children, scrollable, style, refreshing, onRefresh }: AppScreenProps) {
  const content = scrollable ? (
    <ScrollView 
      contentContainerStyle={[{ paddingBottom: 32 }, style]} 
      showsVerticalScrollIndicator={false}
      refreshControl={
        onRefresh ? (
          <RefreshControl 
            refreshing={refreshing ?? false} 
            onRefresh={onRefresh} 
            colors={[colors.primaryDark]} 
            tintColor={colors.primaryDark}
          />
        ) : undefined
      }
    >
      {children}
    </ScrollView>
  ) : (
    children
  );

  return (
    <SafeAreaView style={[{ flex: 1, backgroundColor: colors.background, paddingHorizontal: 20 }, style]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}>
        {content}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
