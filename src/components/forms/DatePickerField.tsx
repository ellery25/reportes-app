import { useRef } from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';

interface Props {
  value?: string;
  onChange: (date: string) => void;
  hasError?: boolean;
}

function parseValue(val?: string) {
  const parts = (val ?? '').split('/');
  return { day: parts[0] ?? '', month: parts[1] ?? '', year: parts[2] ?? '' };
}

export function DatePickerField({ value, onChange, hasError }: Props) {
  const { day, month, year } = parseValue(value);
  const monthRef = useRef<TextInput>(null);
  const yearRef = useRef<TextInput>(null);

  function update(d: string, m: string, y: string) {
    onChange(`${d}/${m}/${y}`);
  }

  return (
    <View style={styles.row}>
      <TextInput
        style={[styles.input, styles.small, hasError && styles.inputError]}
        value={day}
        onChangeText={(v) => {
          const d = v.replace(/\D/g, '').slice(0, 2);
          update(d, month, year);
          if (d.length === 2) monthRef.current?.focus();
        }}
        placeholder="DD"
        placeholderTextColor="#9ca3af"
        keyboardType="numeric"
        maxLength={2}
        returnKeyType="next"
        onSubmitEditing={() => monthRef.current?.focus()}
      />
      <Text style={styles.sep}>/</Text>
      <TextInput
        ref={monthRef}
        style={[styles.input, styles.small, hasError && styles.inputError]}
        value={month}
        onChangeText={(v) => {
          const m = v.replace(/\D/g, '').slice(0, 2);
          update(day, m, year);
          if (m.length === 2) yearRef.current?.focus();
        }}
        placeholder="MM"
        placeholderTextColor="#9ca3af"
        keyboardType="numeric"
        maxLength={2}
        returnKeyType="next"
        onSubmitEditing={() => yearRef.current?.focus()}
      />
      <Text style={styles.sep}>/</Text>
      <TextInput
        ref={yearRef}
        style={[styles.input, styles.large, hasError && styles.inputError]}
        value={year}
        onChangeText={(v) => {
          const y = v.replace(/\D/g, '').slice(0, 4);
          update(day, month, y);
        }}
        placeholder="AAAA"
        placeholderTextColor="#9ca3af"
        keyboardType="numeric"
        maxLength={4}
        returnKeyType="done"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  input: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, padding: 12,
           fontSize: 15, color: '#111827', backgroundColor: '#fff', textAlign: 'center' },
  small: { width: 58 },
  large: { width: 88 },
  sep: { fontSize: 18, color: '#9ca3af', fontWeight: '600', marginHorizontal: 2 },
  inputError: { borderColor: '#ef4444' },
});
