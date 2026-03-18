import { View, Text, TouchableOpacity, Image, ScrollView, StyleSheet, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

interface Props {
  value: string[];
  onChange: (uris: string[]) => void;
  maxPhotos?: number;
}

export function PhotoGalleryField({ value = [], onChange, maxPhotos = 10 }: Props) {
  async function pickImage() {
    if (value.length >= maxPhotos) {
      Alert.alert('Límite', `Máximo ${maxPhotos} fotos por reporte`);
      return;
    }

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permiso requerido', 'Se necesita acceso a la galería');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      quality: 0.8,
      selectionLimit: maxPhotos - value.length,
    });

    if (!result.canceled) {
      const newUris = result.assets.map((a) => a.uri);
      onChange([...value, ...newUris]);
    }
  }

  async function takePhoto() {
    if (value.length >= maxPhotos) {
      Alert.alert('Límite', `Máximo ${maxPhotos} fotos por reporte`);
      return;
    }

    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permiso requerido', 'Se necesita acceso a la cámara');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({ quality: 0.8 });
    if (!result.canceled) {
      onChange([...value, result.assets[0].uri]);
    }
  }

  function removePhoto(index: number) {
    onChange(value.filter((_, i) => i !== index));
  }

  return (
    <View style={styles.container}>
      <View style={styles.btnRow}>
        <TouchableOpacity style={styles.addBtn} onPress={takePhoto}>
          <Text style={styles.addBtnText}>📷 Cámara</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.addBtn} onPress={pickImage}>
          <Text style={styles.addBtnText}>🖼 Galería</Text>
        </TouchableOpacity>
      </View>

      {value.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scroll}>
          {value.map((uri, index) => (
            <View key={`${uri}-${index}`} style={styles.photoWrapper}>
              <Image source={{ uri }} style={styles.photo} />
              <TouchableOpacity style={styles.removeBtn} onPress={() => removePhoto(index)}>
                <Text style={styles.removeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      )}

      <Text style={styles.counter}>{value.length}/{maxPhotos} fotos</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 10 },
  btnRow: { flexDirection: 'row', gap: 10 },
  addBtn: { flex: 1, borderWidth: 1.5, borderColor: '#1e3a5f', borderStyle: 'dashed',
            borderRadius: 8, padding: 12, alignItems: 'center' },
  addBtnText: { color: '#1e3a5f', fontWeight: '600', fontSize: 14 },
  scroll: { marginTop: 4 },
  photoWrapper: { position: 'relative', marginRight: 8 },
  photo: { width: 90, height: 90, borderRadius: 6, backgroundColor: '#f3f4f6' },
  removeBtn: { position: 'absolute', top: -6, right: -6, backgroundColor: '#ef4444',
               width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  removeBtnText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  counter: { fontSize: 12, color: '#9ca3af', textAlign: 'right' },
});
