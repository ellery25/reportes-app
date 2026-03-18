import { Redirect } from 'expo-router';
import { useAuthStore } from '../src/stores/auth.store';

export default function Index() {
  const { session, isLoading } = useAuthStore();

  if (isLoading) return null;

  return session ? <Redirect href="/(app)" /> : <Redirect href="/(auth)/login" />;
}
