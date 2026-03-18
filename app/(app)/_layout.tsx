import { Tabs } from 'expo-router';
import { Text } from 'react-native';
import { useAuthStore } from '../../src/stores/auth.store';
import { Redirect } from 'expo-router';

export default function AppLayout() {
  const { session, isLoading } = useAuthStore();

  if (isLoading) return null;
  if (!session) return <Redirect href="/(auth)/login" />;

  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: '#1e3a5f' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: '700' },
        tabBarActiveTintColor: '#1e3a5f',
        tabBarInactiveTintColor: '#9ca3af',
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Reportes',
          tabBarLabel: 'Reportes',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>📋</Text>,
        }}
      />
      <Tabs.Screen
        name="reports/new"
        options={{
          title: 'Nuevo Reporte',
          tabBarLabel: 'Nuevo',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>➕</Text>,
        }}
      />
      <Tabs.Screen
        name="reports/[id]"
        options={{ href: null }}
      />
      <Tabs.Screen
        name="reports/[id]/edit"
        options={{ href: null, title: 'Editar Reporte' }}
      />
    </Tabs>
  );
}
