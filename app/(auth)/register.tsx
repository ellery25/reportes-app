import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { Link, router } from 'expo-router';
import { authService } from '../../src/services/auth.service';

export default function RegisterScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function handleRegister() {
    setError('');
    setSuccess('');
    if (!email || !password) {
      setError('Por favor completa todos los campos');
      return;
    }
    if (password.length < 6) {
      setError('La contraseña debe tener mínimo 6 caracteres');
      return;
    }
    setLoading(true);
    try {
      await authService.signUp(email, password);
      setSuccess('¡Registro exitoso! Revisa tu correo para confirmar tu cuenta.');
      setTimeout(() => router.replace('/(auth)/login'), 3000);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error al registrarse');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.card}>
        <View style={styles.logoBlock}>
          <Text style={styles.logoMain}>RCE</Text>
          <Text style={styles.logoSub}>INGENIERIA</Text>
        </View>
        <Text style={styles.subtitle}>Crear Cuenta</Text>

        <TextInput
          style={styles.input}
          placeholder="Correo electrónico"
          placeholderTextColor="#9ca3af"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={(v) => { setEmail(v); setError(''); }}
        />
        <TextInput
          style={styles.input}
          placeholder="Contraseña (mín. 6 caracteres)"
          placeholderTextColor="#9ca3af"
          secureTextEntry
          value={password}
          onChangeText={(v) => { setPassword(v); setError(''); }}
        />

        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        {success ? <Text style={styles.successText}>{success}</Text> : null}

        <TouchableOpacity
          style={[styles.btn, loading && styles.btnDisabled]}
          onPress={handleRegister}
          disabled={loading}
        >
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.btnText}>Registrarse</Text>}
        </TouchableOpacity>

        <Link href="/(auth)/login" asChild>
          <TouchableOpacity style={styles.linkBtn}>
            <Text style={styles.linkText}>¿Ya tienes cuenta? Inicia sesión</Text>
          </TouchableOpacity>
        </Link>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6', justifyContent: 'center', padding: 24 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 28, shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 4 },
  logoBlock: { alignItems: 'center', marginBottom: 8 },
  logoMain: { fontSize: 28, fontWeight: '900', color: '#1e3a5f', letterSpacing: 2 },
  logoSub: { fontSize: 13, fontWeight: '600', color: '#1e3a5f', letterSpacing: 3 },
  subtitle: { fontSize: 22, fontWeight: '700', color: '#111827', textAlign: 'center', marginBottom: 24 },
  input: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, padding: 12,
           fontSize: 15, color: '#111827', marginBottom: 12 },
  errorText: { backgroundColor: '#fef2f2', borderWidth: 1, borderColor: '#fca5a5',
               borderRadius: 8, padding: 10, color: '#dc2626', fontSize: 13,
               marginBottom: 12, lineHeight: 18 },
  successText: { backgroundColor: '#f0fdf4', borderWidth: 1, borderColor: '#86efac',
                 borderRadius: 8, padding: 10, color: '#16a34a', fontSize: 13,
                 marginBottom: 12, lineHeight: 18 },
  btn: { backgroundColor: '#1e3a5f', borderRadius: 8, padding: 14, alignItems: 'center', marginTop: 4 },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  linkBtn: { marginTop: 16, alignItems: 'center' },
  linkText: { color: '#1e3a5f', fontSize: 14 },
});
