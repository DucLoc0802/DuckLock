import { Href, Redirect } from 'expo-router';

import { useAppStore } from '@/src/store/app-store';

export default function IndexScreen() {
  const { token } = useAppStore();

  return <Redirect href={(token ? '/(tabs)/home' : '/(auth)/login') as Href} />;
}
