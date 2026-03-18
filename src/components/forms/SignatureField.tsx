import { View, Text, TouchableOpacity, StyleSheet, Image, Modal } from 'react-native';
import { useRef, useState } from 'react';
import { WebView } from 'react-native-webview';

interface Props {
  value?: string;
  onChange: (base64: string) => void;
  label?: string;
}

const SIGNATURE_HTML = `
<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { background: #fff; overflow: hidden; }
  canvas { display: block; touch-action: none; }
  .toolbar { display: flex; justify-content: space-between; padding: 8px 12px;
             background: #f3f4f6; border-bottom: 1px solid #e5e7eb; }
  button { padding: 6px 16px; border-radius: 6px; border: none; font-size: 14px;
           font-weight: 600; cursor: pointer; }
  .clear { background: #fee2e2; color: #dc2626; }
  .save  { background: #1e3a5f; color: #fff; }
</style>
</head>
<body>
<div class="toolbar">
  <button class="clear" onclick="clearCanvas()">Limpiar</button>
  <button class="save" onclick="saveSignature()">Guardar</button>
</div>
<canvas id="c"></canvas>
<script>
  const canvas = document.getElementById('c');
  const ctx = canvas.getContext('2d');
  let drawing = false;
  let lastX = 0, lastY = 0;

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight - 44;
    ctx.strokeStyle = '#111827';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }
  resize();
  window.addEventListener('resize', resize);

  function getPos(e) {
    const r = canvas.getBoundingClientRect();
    const t = e.touches ? e.touches[0] : e;
    return [t.clientX - r.left, t.clientY - r.top];
  }

  canvas.addEventListener('mousedown', (e) => { drawing = true; [lastX, lastY] = getPos(e); });
  canvas.addEventListener('touchstart', (e) => { e.preventDefault(); drawing = true; [lastX, lastY] = getPos(e); });

  function draw(e) {
    if (!drawing) return;
    e.preventDefault();
    const [x, y] = getPos(e);
    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(x, y);
    ctx.stroke();
    [lastX, lastY] = [x, y];
  }
  canvas.addEventListener('mousemove', draw);
  canvas.addEventListener('touchmove', draw, { passive: false });

  function stop() { drawing = false; }
  canvas.addEventListener('mouseup', stop);
  canvas.addEventListener('touchend', stop);

  function clearCanvas() { ctx.clearRect(0, 0, canvas.width, canvas.height); }

  function saveSignature() {
    const data = canvas.toDataURL('image/png');
    window.ReactNativeWebView.postMessage(data);
  }
</script>
</body>
</html>
`;

export function SignatureField({ value, onChange, label }: Props) {
  const [modalVisible, setModalVisible] = useState(false);
  const webViewRef = useRef<WebView>(null);

  function handleMessage(event: { nativeEvent: { data: string } }) {
    const data = event.nativeEvent.data;
    if (data.startsWith('data:image/png')) {
      onChange(data);
      setModalVisible(false);
    }
  }

  return (
    <View style={styles.container}>
      {value ? (
        <View style={styles.preview}>
          <Image source={{ uri: value }} style={styles.sigImage} resizeMode="contain" />
          <TouchableOpacity style={styles.editBtn} onPress={() => setModalVisible(true)}>
            <Text style={styles.editBtnText}>✏️ Cambiar firma</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity style={styles.placeholder} onPress={() => setModalVisible(true)}>
          <Text style={styles.placeholderText}>✍️ Firmar aquí</Text>
          {label && <Text style={styles.labelText}>{label}</Text>}
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
          <WebView
            ref={webViewRef}
            source={{ html: SIGNATURE_HTML }}
            onMessage={handleMessage}
            scrollEnabled={false}
            style={{ flex: 1 }}
          />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {},
  preview: { alignItems: 'center', gap: 8 },
  sigImage: { width: '100%', height: 100, backgroundColor: '#f9fafb',
              borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 6 },
  editBtn: { paddingVertical: 6, paddingHorizontal: 16, borderRadius: 6,
             backgroundColor: '#f3f4f6', borderWidth: 1, borderColor: '#d1d5db' },
  editBtnText: { fontSize: 13, color: '#374151', fontWeight: '600' },
  placeholder: { borderWidth: 1.5, borderColor: '#1e3a5f', borderStyle: 'dashed',
                  borderRadius: 8, padding: 24, alignItems: 'center', gap: 4,
                  backgroundColor: '#f8faff' },
  placeholderText: { fontSize: 16, color: '#1e3a5f', fontWeight: '600' },
  labelText: { fontSize: 12, color: '#6b7280' },
  modal: { flex: 1, backgroundColor: '#fff' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
                  padding: 16, borderBottomWidth: 1, borderBottomColor: '#e5e7eb',
                  backgroundColor: '#1e3a5f' },
  modalTitle: { fontSize: 16, fontWeight: '700', color: '#fff' },
  closeBtn: { fontSize: 20, color: '#fff', fontWeight: '700', paddingHorizontal: 8 },
});
