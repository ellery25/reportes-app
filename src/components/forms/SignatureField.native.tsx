import { useRef, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Image,
  Modal, PanResponder, StyleSheet as RNStyleSheet,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';

interface Props {
  value?: string;
  onChange: (base64: string) => void;
  label?: string;
}

const PAD_W = 320;
const PAD_H = 160;

export function SignatureField({ value, onChange, label }: Props) {
  const [modalVisible, setModalVisible] = useState(false);
  const [paths, setPaths] = useState<string[]>([]);
  const currentPath = useRef('');
  const [tick, setTick] = useState(0); // forces re-render during drawing

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        const { locationX, locationY } = evt.nativeEvent;
        currentPath.current = `M ${locationX.toFixed(1)} ${locationY.toFixed(1)}`;
        setTick((n) => n + 1);
      },
      onPanResponderMove: (evt) => {
        const { locationX, locationY } = evt.nativeEvent;
        currentPath.current += ` L ${locationX.toFixed(1)} ${locationY.toFixed(1)}`;
        setTick((n) => n + 1);
      },
      onPanResponderRelease: () => {
        if (currentPath.current) {
          setPaths((prev) => [...prev, currentPath.current]);
          currentPath.current = '';
        }
      },
    })
  ).current;

  function clear() {
    setPaths([]);
    currentPath.current = '';
  }

  function save() {
    if (paths.length === 0) return;
    const pathsMarkup = paths
      .map((d) => `<path d="${d}" stroke="black" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`)
      .join('');
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${PAD_W}" height="${PAD_H}">${pathsMarkup}</svg>`;
    const b64 = btoa(unescape(encodeURIComponent(svg)));
    onChange(`data:image/svg+xml;base64,${b64}`);
    setModalVisible(false);
    setPaths([]);
    currentPath.current = '';
  }

  return (
    <View>
      {value ? (
        <View style={styles.preview}>
          <Image source={{ uri: value }} style={styles.sigImage} resizeMode="contain" />
          <View style={styles.previewActions}>
            <TouchableOpacity style={styles.editBtn} onPress={() => setModalVisible(true)}>
              <Text style={styles.editBtnText}>✏️ Cambiar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.clearBtn} onPress={() => onChange('')}>
              <Text style={styles.clearBtnText}>🗑 Quitar</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <TouchableOpacity style={styles.placeholder} onPress={() => setModalVisible(true)}>
          <Text style={styles.placeholderText}>✍️ Firmar aquí</Text>
          {label && <Text style={styles.labelHint}>{label}</Text>}
        </TouchableOpacity>
      )}

      <Modal visible={modalVisible} animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Firma — {label}</Text>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Text style={styles.closeBtn}>✕</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.padArea}>
            <View style={styles.pad} {...panResponder.panHandlers}>
              <Svg width={PAD_W} height={PAD_H}>
                {paths.map((d, i) => (
                  <Path key={i} d={d} stroke="#111827" strokeWidth={2.5} fill="none"
                    strokeLinecap="round" strokeLinejoin="round" />
                ))}
                {currentPath.current ? (
                  <Path d={currentPath.current} stroke="#111827" strokeWidth={2.5} fill="none"
                    strokeLinecap="round" strokeLinejoin="round" />
                ) : null}
              </Svg>
              {paths.length === 0 && !currentPath.current && (
                <View style={RNStyleSheet.absoluteFill} pointerEvents="none">
                  <View style={styles.hintWrapper}>
                    <Text style={styles.hintText}>Dibuje su firma aquí</Text>
                  </View>
                </View>
              )}
            </View>
          </View>

          <View style={styles.actions}>
            <TouchableOpacity style={styles.clearBtn} onPress={clear}>
              <Text style={styles.clearText}>Limpiar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.saveBtn, paths.length === 0 && styles.btnDisabled]}
              onPress={save}
              disabled={paths.length === 0}
            >
              <Text style={styles.saveText}>Guardar firma</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  preview: { alignItems: 'center', gap: 8 },
  sigImage: { width: '100%', height: 100, backgroundColor: '#f9fafb',
              borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 6 },
  previewActions: { flexDirection: 'row', gap: 8 },
  editBtn: { paddingVertical: 6, paddingHorizontal: 16, borderRadius: 6,
             backgroundColor: '#f3f4f6', borderWidth: 1, borderColor: '#d1d5db' },
  editBtnText: { fontSize: 13, color: '#374151', fontWeight: '600' },
  clearBtn: { paddingVertical: 6, paddingHorizontal: 16, borderRadius: 6,
              backgroundColor: '#fef2f2', borderWidth: 1, borderColor: '#fca5a5' },
  clearBtnText: { fontSize: 13, color: '#ef4444', fontWeight: '600' },
  placeholder: { borderWidth: 1.5, borderColor: '#1e3a5f', borderStyle: 'dashed',
                  borderRadius: 8, padding: 24, alignItems: 'center', gap: 4,
                  backgroundColor: '#f8faff' },
  placeholderText: { fontSize: 16, color: '#1e3a5f', fontWeight: '600' },
  labelHint: { fontSize: 12, color: '#6b7280' },
  modal: { flex: 1, backgroundColor: '#fff' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
                  padding: 16, borderBottomWidth: 1, borderBottomColor: '#e5e7eb',
                  backgroundColor: '#1e3a5f' },
  modalTitle: { fontSize: 16, fontWeight: '700', color: '#fff' },
  closeBtn: { fontSize: 20, color: '#fff', fontWeight: '700', paddingHorizontal: 8 },
  padArea: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 16 },
  pad: { width: PAD_W, height: PAD_H, backgroundColor: '#f9fafb',
         borderWidth: 1.5, borderColor: '#d1d5db', borderRadius: 8, overflow: 'hidden' },
  hintWrapper: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  hintText: { color: '#d1d5db', fontSize: 14 },
  actions: { flexDirection: 'row', gap: 12, padding: 16,
             borderTopWidth: 1, borderTopColor: '#e5e7eb' },
  clearBtn: { flex: 1, borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8,
              padding: 13, alignItems: 'center' },
  clearText: { color: '#6b7280', fontWeight: '600', fontSize: 14 },
  saveBtn: { flex: 1, backgroundColor: '#1e3a5f', borderRadius: 8,
             padding: 13, alignItems: 'center' },
  saveText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  btnDisabled: { opacity: 0.4 },
});
