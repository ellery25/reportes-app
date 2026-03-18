import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { TEMPLATES } from '../../../src/templates';
import { reportService } from '../../../src/services/report.service';
import { useAuthStore } from '../../../src/stores/auth.store';

export default function NewReportScreen() {
  const { user } = useAuthStore();
  const [creating, setCreating] = useState<string | null>(null);

  async function handleSelect(code: string) {
    if (!user) return;
    setCreating(code);
    try {
      const report = await reportService.createDraft(code, user.id);
      router.push(`/(app)/reports/${report.id}/edit`);
    } catch (e) {
      Alert.alert('Error', 'No se pudo crear el reporte');
    } finally {
      setCreating(null);
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>Selecciona un tipo de reporte</Text>
      <Text style={styles.subheading}>
        Elige el formato que necesitas completar
      </Text>

      {TEMPLATES.map((template) => (
        <TouchableOpacity
          key={template.code}
          style={styles.card}
          onPress={() => handleSelect(template.code)}
          disabled={creating !== null}
        >
          <View style={styles.cardIcon}>
            <Text style={styles.cardIconText}>📄</Text>
          </View>
          <View style={styles.cardInfo}>
            <Text style={styles.cardName}>{template.name}</Text>
            <Text style={styles.cardMeta}>
              Versión {template.version} · {template.sections.length} secciones
            </Text>
            <Text style={styles.cardMeta}>
              {template.fields.filter(f => f.required).length} campos requeridos
            </Text>
          </View>
          {creating === template.code
            ? <ActivityIndicator color="#1e3a5f" />
            : <Text style={styles.arrow}>›</Text>}
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6' },
  content: { padding: 16, gap: 12 },
  heading: { fontSize: 20, fontWeight: '700', color: '#111827', marginBottom: 2 },
  subheading: { fontSize: 14, color: '#6b7280', marginBottom: 8 },
  card: { backgroundColor: '#fff', borderRadius: 10, padding: 16, flexDirection: 'row',
          alignItems: 'center', gap: 14, shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06,
          shadowRadius: 4, elevation: 2 },
  cardIcon: { width: 48, height: 48, backgroundColor: '#e8f0fe', borderRadius: 10,
              alignItems: 'center', justifyContent: 'center' },
  cardIconText: { fontSize: 24 },
  cardInfo: { flex: 1 },
  cardName: { fontSize: 15, fontWeight: '700', color: '#111827', marginBottom: 4 },
  cardMeta: { fontSize: 12, color: '#6b7280' },
  arrow: { fontSize: 24, color: '#9ca3af', fontWeight: '300' },
});
