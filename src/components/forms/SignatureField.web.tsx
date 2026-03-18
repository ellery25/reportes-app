import { useRef, useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import React from 'react';

interface Props {
  value?: string;
  onChange: (base64: string) => void;
  label?: string;
}

export function SignatureField({ value, onChange, label }: Props) {
  const [showPad, setShowPad] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawing = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });

  function getPos(e: MouseEvent | Touch, canvas: HTMLCanvasElement) {
    const rect = canvas.getBoundingClientRect();
    const source = 'clientX' in e ? e : e;
    return { x: source.clientX - rect.left, y: source.clientY - rect.top };
  }

  useEffect(() => {
    if (!showPad) return;

    const setup = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.strokeStyle = '#111827';
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
    };

    const onMouseDown = (e: MouseEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      drawing.current = true;
      lastPos.current = getPos(e, canvas);
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!drawing.current) return;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      const pos = getPos(e, canvas);
      ctx.beginPath();
      ctx.moveTo(lastPos.current.x, lastPos.current.y);
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
      lastPos.current = pos;
    };

    const onTouchStart = (e: TouchEvent) => {
      e.preventDefault();
      const canvas = canvasRef.current;
      if (!canvas) return;
      drawing.current = true;
      lastPos.current = getPos(e.touches[0], canvas);
    };

    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      if (!drawing.current) return;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      const pos = getPos(e.touches[0], canvas);
      ctx.beginPath();
      ctx.moveTo(lastPos.current.x, lastPos.current.y);
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
      lastPos.current = pos;
    };

    const stop = () => { drawing.current = false; };

    // Small delay to let canvas mount
    const timer = setTimeout(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      setup();
      canvas.addEventListener('mousedown', onMouseDown);
      canvas.addEventListener('mousemove', onMouseMove);
      canvas.addEventListener('mouseup', stop);
      canvas.addEventListener('touchstart', onTouchStart, { passive: false });
      canvas.addEventListener('touchmove', onTouchMove, { passive: false });
      canvas.addEventListener('touchend', stop);
    }, 50);

    return () => {
      clearTimeout(timer);
      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.removeEventListener('mousedown', onMouseDown);
      canvas.removeEventListener('mousemove', onMouseMove);
      canvas.removeEventListener('mouseup', stop);
      canvas.removeEventListener('touchstart', onTouchStart);
      canvas.removeEventListener('touchmove', onTouchMove);
      canvas.removeEventListener('touchend', stop);
    };
  }, [showPad]);

  function clearCanvas() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.getContext('2d')?.clearRect(0, 0, canvas.width, canvas.height);
  }

  function saveSignature() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    onChange(canvas.toDataURL('image/png'));
    setShowPad(false);
  }

  if (showPad) {
    return (
      <View style={styles.padContainer}>
        <View style={styles.padHeader}>
          <Text style={styles.padTitle}>Firma — {label}</Text>
          <View style={styles.padActions}>
            <TouchableOpacity style={styles.clearBtn} onPress={clearCanvas}>
              <Text style={styles.clearBtnText}>Limpiar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveSignBtn} onPress={saveSignature}>
              <Text style={styles.saveSignBtnText}>Guardar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowPad(false)}>
              <Text style={styles.cancelBtnText}>✕</Text>
            </TouchableOpacity>
          </View>
        </View>
        {React.createElement('canvas', {
          ref: canvasRef,
          style: {
            width: '100%',
            height: 180,
            border: '1.5px solid #d1d5db',
            borderRadius: 6,
            backgroundColor: '#fff',
            cursor: 'crosshair',
            display: 'block',
            touchAction: 'none',
          },
        } as any)}
        <Text style={styles.hint}>Dibuja tu firma arriba</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {value ? (
        <View style={styles.preview}>
          <Image source={{ uri: value }} style={styles.sigImage} resizeMode="contain" />
          <View style={styles.previewActions}>
            <TouchableOpacity style={styles.editBtn} onPress={() => setShowPad(true)}>
              <Text style={styles.editBtnText}>✏️ Cambiar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.removeBtn} onPress={() => onChange('')}>
              <Text style={styles.removeBtnText}>🗑 Quitar</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <TouchableOpacity style={styles.placeholder} onPress={() => setShowPad(true)}>
          <Text style={styles.placeholderText}>✍️ Firmar aquí</Text>
          {label && <Text style={styles.labelText}>{label}</Text>}
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {},
  preview: { alignItems: 'center', gap: 8 },
  sigImage: { width: '100%' as any, height: 100, backgroundColor: '#f9fafb',
              borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 6 },
  previewActions: { flexDirection: 'row', gap: 8 },
  editBtn: { paddingVertical: 6, paddingHorizontal: 16, borderRadius: 6,
             backgroundColor: '#f3f4f6', borderWidth: 1, borderColor: '#d1d5db' },
  editBtnText: { fontSize: 13, color: '#374151', fontWeight: '600' },
  removeBtn: { paddingVertical: 6, paddingHorizontal: 16, borderRadius: 6,
               backgroundColor: '#fef2f2', borderWidth: 1, borderColor: '#fca5a5' },
  removeBtnText: { fontSize: 13, color: '#ef4444', fontWeight: '600' },
  placeholder: { borderWidth: 1.5, borderColor: '#1e3a5f', borderStyle: 'dashed',
                 borderRadius: 8, padding: 24, alignItems: 'center', gap: 4,
                 backgroundColor: '#f8faff' },
  placeholderText: { fontSize: 16, color: '#1e3a5f', fontWeight: '600' },
  labelText: { fontSize: 12, color: '#6b7280' },
  padContainer: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8, overflow: 'hidden' },
  padHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
               padding: 10, backgroundColor: '#1e3a5f' },
  padTitle: { color: '#fff', fontWeight: '700', fontSize: 13 },
  padActions: { flexDirection: 'row', gap: 8 },
  clearBtn: { backgroundColor: '#fee2e2', paddingVertical: 4, paddingHorizontal: 10, borderRadius: 6 },
  clearBtnText: { color: '#dc2626', fontWeight: '600', fontSize: 12 },
  saveSignBtn: { backgroundColor: '#fff', paddingVertical: 4, paddingHorizontal: 10, borderRadius: 6 },
  saveSignBtnText: { color: '#1e3a5f', fontWeight: '700', fontSize: 12 },
  cancelBtn: { paddingHorizontal: 6, justifyContent: 'center' },
  cancelBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  hint: { fontSize: 11, color: '#9ca3af', textAlign: 'center', paddingVertical: 6,
          backgroundColor: '#f9fafb' },
});
