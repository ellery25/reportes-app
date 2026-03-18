import { View, Text, TextInput, StyleSheet } from 'react-native';
import { Controller } from 'react-hook-form';
import type { Control } from 'react-hook-form';
import type { FieldDefinition } from '../../templates/types';
import { PhotoGalleryField } from './PhotoGalleryField';
import { SignatureField } from './SignatureField';
import { DatePickerField } from './DatePickerField';

interface Props {
  field: FieldDefinition;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  control: Control<any>;
  onAfterChange?: () => void;
}

export function DynamicField({ field, control, onAfterChange }: Props) {
  return (
    <Controller
      control={control}
      name={field.key}
      rules={{ required: field.required ? `${field.label} es requerido` : false }}
      render={({ field: { value, onChange, onBlur }, fieldState: { error } }) => (
        <View style={styles.wrapper}>
          <Text style={styles.label}>
            {field.label}
            {field.required && <Text style={styles.required}> *</Text>}
          </Text>

          {field.type === 'text' && (
            <TextInput
              style={[styles.input, error && styles.inputError]}
              value={value ?? ''}
              onChangeText={onChange}
              onBlur={() => { onBlur(); onAfterChange?.(); }}
              placeholder={field.placeholder ?? `Ingresa ${field.label.toLowerCase()}`}
              placeholderTextColor="#9ca3af"
            />
          )}

          {field.type === 'textarea' && (
            <TextInput
              style={[styles.input, styles.textarea, error && styles.inputError]}
              value={value ?? ''}
              onChangeText={onChange}
              onBlur={() => { onBlur(); onAfterChange?.(); }}
              placeholder={field.placeholder ?? `Ingresa ${field.label.toLowerCase()}`}
              placeholderTextColor="#9ca3af"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          )}

          {field.type === 'number' && (
            <TextInput
              style={[styles.input, error && styles.inputError]}
              value={value?.toString() ?? ''}
              onChangeText={(v) => onChange(v ? Number(v) : '')}
              onBlur={() => { onBlur(); onAfterChange?.(); }}
              keyboardType="numeric"
              placeholder={field.placeholder ?? '0'}
              placeholderTextColor="#9ca3af"
            />
          )}

          {field.type === 'date' && (
            <DatePickerField
              value={value ?? ''}
              onChange={(v) => { onChange(v); onAfterChange?.(); }}
              hasError={!!error}
            />
          )}

          {field.type === 'photo_gallery' && (
            <PhotoGalleryField
              value={value ?? []}
              onChange={(v) => { onChange(v); onAfterChange?.(); }}
              maxPhotos={field.maxPhotos}
            />
          )}

          {field.type === 'signature' && (
            <SignatureField
              value={value}
              onChange={(v) => { onChange(v); onAfterChange?.(); }}
              label={field.label}
            />
          )}

          {error && <Text style={styles.errorText}>{error.message}</Text>}
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  wrapper: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 6 },
  required: { color: '#ef4444' },
  input: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, padding: 12,
           fontSize: 15, color: '#111827', backgroundColor: '#fff' },
  textarea: { minHeight: 100, paddingTop: 10 },
  inputError: { borderColor: '#ef4444' },
  errorText: { fontSize: 12, color: '#ef4444', marginTop: 4 },
});
