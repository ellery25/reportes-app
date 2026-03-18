import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { authService } from '../src/services/auth.service';
import { useAuthStore } from '../src/stores/auth.store';

export default function RootLayout() {
  const { setSession, setLoading } = useAuthStore();

  useEffect(() => {
    authService.getSession().then((session) => {
      setSession(session);
      setLoading(false);
    });

    const { data } = authService.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => data.subscription.unsubscribe();
  }, []);

  return (
    <>
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(app)" />
      </Stack>
    </>
  );
}
