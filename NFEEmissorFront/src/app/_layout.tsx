import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';
import { Platform } from 'react-native';

import { Colors } from '@/constants/theme';
import { AuthProvider, useAuth } from '@/hooks/use-auth';

const queryClient = new QueryClient();

export default function RootLayout() {
  const colors = Colors.light;

  useEffect(() => {
    if (Platform.OS !== 'web') return;

    const root = document.documentElement;
    root.style.colorScheme = 'light';
    root.style.backgroundColor = colors.background;
    document.body.style.backgroundColor = colors.background;

    let meta = document.querySelector('meta[name="color-scheme"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute('name', 'color-scheme');
      document.head.appendChild(meta);
    }
    meta.setAttribute('content', 'light');
  }, [colors.background]);

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClient}>
        <Navigation />
      </QueryClientProvider>
    </AuthProvider>
  );
}

function Navigation() {
  const router = useRouter();
  const segments = useSegments();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return;
    const onLogin = segments[0] === 'login';
    if (!user && !onLogin) router.replace('/login');
    if (user && onLogin) router.replace('/');
  }, [isLoading, router, segments, user]);

  const colors = Colors.light;
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.text,
        contentStyle: { backgroundColor: colors.background },
        headerTitleStyle: { color: colors.text },
      }}
    />
  );
}