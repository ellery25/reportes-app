import { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, TextInput,
  StyleSheet, ActivityIndicator, RefreshControl,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { reportService } from '../../src/services/report.service';
import { authService } from '../../src/services/auth.service';
import { useReportStore } from '../../src/stores/report.store';
import type { Report } from '../../src/lib/database.types';

const STATUS_FILTERS = [
  { key: 'all',       label: 'Todos' },
  { key: 'draft',     label: 'Borradores' },
  { key: 'completed', label: 'Completados' },
  { key: 'archived',  label: 'Archivados' },
];

const STATUS_COLORS: Record<string, string> = {
  draft: '#f59e0b',
  completed: '#10b981',
  archived: '#9ca3af',
};
const STATUS_LABELS: Record<string, string> = {
  draft: 'Borrador',
  completed: 'Completado',
  archived: 'Archivado',
};

export default function ReportListScreen() {
  const { reports, isLoadingList, setReports, setLoadingList } = useReportStore();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState('');

  const loadReports = useCallback(async () => {
    setLoadingList(true);
    setLoadError('');
    try {
      const data = await reportService.list({ status: filter, search });
      setReports(data);
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : 'No se pudieron cargar los reportes');
    } finally {
      setLoadingList(false);
    }
  }, [filter, search]);

  useEffect(() => { loadReports(); }, [loadReports]);

  // Refresh list whenever the screen comes into focus (e.g. after archive/complete/delete)
  useFocusEffect(useCallback(() => { loadReports(); }, [loadReports]));

  async function handleRefresh() {
    setRefreshing(true);
    await loadReports();
    setRefreshing(false);
  }

  async function handleLogout() {
    await authService.signOut();
    router.replace('/(auth)/login');
  }

  function renderItem({ item }: { item: Report }) {
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => router.push(`/(app)/reports/${item.id}`)}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.cardClient}>
            {item.client_name ?? `Reporte #${item.id.slice(0, 8).toUpperCase()}`}
          </Text>
          <View style={[styles.badge, { backgroundColor: STATUS_COLORS[item.status] + '20' }]}>
            <Text style={[styles.badgeText, { color: STATUS_COLORS[item.status] }]}>
              {STATUS_LABELS[item.status]}
            </Text>
          </View>
        </View>
        <Text style={styles.cardSub}>
          {item.equipment ?? item.template_code} · {item.city ?? '—'} · {item.report_date ?? '—'}
        </Text>
        <Text style={styles.cardDate}>
          Actualizado: {new Date(item.updated_at).toLocaleDateString('es-CO')}
        </Text>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.container}>
      {/* Search */}
      <View style={styles.searchRow}>
        <TextInput
          style={styles.search}
          placeholder="Buscar por cliente..."
          placeholderTextColor="#9ca3af"
          value={search}
          onChangeText={setSearch}
          returnKeyType="search"
          onSubmitEditing={loadReports}
        />
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutText}>Salir</Text>
        </TouchableOpacity>
      </View>

      {/* Filters */}
      <View style={styles.filters}>
        {STATUS_FILTERS.map((f) => (
          <TouchableOpacity
            key={f.key}
            style={[styles.filterChip, filter === f.key && styles.filterChipActive]}
            onPress={() => setFilter(f.key)}
          >
            <Text style={[styles.filterText, filter === f.key && styles.filterTextActive]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loadError ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorTitle}>Error al cargar reportes</Text>
          <Text style={styles.errorMsg}>{loadError}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={loadReports}>
            <Text style={styles.retryText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      ) : isLoadingList && reports.length === 0 ? (
        <ActivityIndicator style={{ marginTop: 40 }} color="#1e3a5f" size="large" />
      ) : (
        <FlatList
          data={reports}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
          ListEmptyComponent={
            <Text style={styles.empty}>No hay reportes. Crea uno nuevo con ➕</Text>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6' },
  searchRow: { flexDirection: 'row', padding: 12, gap: 8, backgroundColor: '#fff',
               borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  search: { flex: 1, borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8,
            padding: 10, fontSize: 14, color: '#111827' },
  logoutBtn: { justifyContent: 'center', paddingHorizontal: 12,
               backgroundColor: '#f3f4f6', borderRadius: 8,
               borderWidth: 1, borderColor: '#d1d5db' },
  logoutText: { fontSize: 13, color: '#6b7280', fontWeight: '600' },
  filters: { flexDirection: 'row', paddingHorizontal: 12, paddingVertical: 8,
             gap: 8, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  filterChip: { paddingVertical: 5, paddingHorizontal: 12, borderRadius: 16,
                borderWidth: 1, borderColor: '#d1d5db', backgroundColor: '#fff' },
  filterChipActive: { backgroundColor: '#1e3a5f', borderColor: '#1e3a5f' },
  filterText: { fontSize: 12, color: '#6b7280', fontWeight: '500' },
  filterTextActive: { color: '#fff' },
  list: { padding: 12, gap: 10 },
  card: { backgroundColor: '#fff', borderRadius: 10, padding: 14,
          shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  cardClient: { fontSize: 15, fontWeight: '700', color: '#111827', flex: 1 },
  badge: { paddingVertical: 2, paddingHorizontal: 8, borderRadius: 12 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  cardSub: { fontSize: 13, color: '#6b7280', marginBottom: 4 },
  cardDate: { fontSize: 11, color: '#9ca3af' },
  empty: { textAlign: 'center', color: '#9ca3af', marginTop: 60, fontSize: 15 },
  errorBox: { margin: 16, backgroundColor: '#fef2f2', borderWidth: 1, borderColor: '#fca5a5',
              borderRadius: 10, padding: 16, alignItems: 'center', gap: 8 },
  errorTitle: { color: '#dc2626', fontWeight: '700', fontSize: 15 },
  errorMsg: { color: '#dc2626', fontSize: 13, textAlign: 'center', lineHeight: 18 },
  retryBtn: { marginTop: 4, backgroundColor: '#dc2626', borderRadius: 8,
              paddingVertical: 8, paddingHorizontal: 20 },
  retryText: { color: '#fff', fontWeight: '700', fontSize: 13 },
});
