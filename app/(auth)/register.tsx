import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTheme, type Theme } from '@/constants/theme';
import { signUpWithEmail } from '@/lib/auth';
import { useAuthStore } from '@/stores/authStore';

export default function RegisterScreen() {
  const t = useTheme();
  const s = makeStyles(t);
  const setSession = useAuthStore((s) => s.setSession);

  const [displayName, setDisplayName]         = useState('');
  const [email, setEmail]                     = useState('');
  const [password, setPassword]               = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading]                 = useState(false);

  async function handleRegister() {
    const nameTrimmed  = displayName.trim();
    const emailTrimmed = email.trim().toLowerCase();

    if (!nameTrimmed || !emailTrimmed || !password) {
      Alert.alert('Campos requeridos', 'Rellena todos los campos.');
      return;
    }
    if (nameTrimmed.length < 2) {
      Alert.alert('Nombre muy corto', 'El nombre debe tener al menos 2 caracteres.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrimmed)) {
      Alert.alert('Email inválido', 'Introduce un email con formato correcto.');
      return;
    }
    if (password.length < 8) {
      Alert.alert('Contraseña muy corta', 'La contraseña debe tener al menos 8 caracteres.');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Contraseñas distintas', 'Las contraseñas no coinciden.');
      return;
    }
    setLoading(true);
    try {
      const { user, session } = await signUpWithEmail(
        emailTrimmed,
        password,
        nameTrimmed,
      );
      if (user && session) {
        setSession(session);
        router.replace('/(auth)/profile-setup');
      } else {
        Alert.alert('Confirma tu email', 'Te hemos enviado un correo de confirmación. Revísalo y luego inicia sesión.');
        router.replace('/(auth)/login');
      }
    } catch (e) {
      Alert.alert('Error al registrarse', (e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={s.container}>
      <StatusBar style={t.statusBar} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
          <Pressable onPress={() => router.back()} style={s.backButton}>
            <Text style={s.backText}>← Atrás</Text>
          </Pressable>

          <Text style={s.title}>Únete a EventSquad</Text>
          <Text style={s.subtitle}>Crea tu cuenta en segundos</Text>

          <View style={s.form}>
            {[
              { label: '¿Cómo te llamamos?', value: displayName, set: setDisplayName, placeholder: 'Tu nombre o apodo', type: 'words' as const, content: 'name' as const },
              { label: 'Email', value: email, set: setEmail, placeholder: 'tú@ejemplo.com', type: 'none' as const, content: 'emailAddress' as const, keyboard: 'email-address' as const },
            ].map((f) => (
              <View key={f.label} style={s.field}>
                <Text style={s.label}>{f.label}</Text>
                <TextInput
                  style={s.input}
                  value={f.value}
                  onChangeText={f.set}
                  autoCapitalize={f.type}
                  autoCorrect={false}
                  keyboardType={f.keyboard ?? 'default'}
                  textContentType={f.content}
                  placeholder={f.placeholder}
                  placeholderTextColor={t.textTertiary}
                  maxLength={f.label === '¿Cómo te llamamos?' ? 50 : undefined}
                />
              </View>
            ))}

            <View style={s.field}>
              <Text style={s.label}>Contraseña</Text>
              <TextInput style={s.input} value={password} onChangeText={setPassword} secureTextEntry textContentType="newPassword" placeholder="Mínimo 8 caracteres" placeholderTextColor={t.textTertiary} />
            </View>
            <View style={s.field}>
              <Text style={s.label}>Confirmar contraseña</Text>
              <TextInput style={s.input} value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry textContentType="newPassword" placeholder="Repite la contraseña" placeholderTextColor={t.textTertiary} />
            </View>

            <Pressable style={[s.primaryButton, loading && s.buttonDisabled]} onPress={handleRegister} disabled={loading}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.primaryButtonText}>Crear cuenta</Text>}
            </Pressable>
          </View>

          <View style={s.footer}>
            <Text style={s.footerText}>¿Ya tienes cuenta? </Text>
            <Pressable onPress={() => router.replace('/(auth)/login')}>
              <Text style={s.footerLink}>Inicia sesión</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function makeStyles(t: Theme) {
  return StyleSheet.create({
    container:         { flex: 1, backgroundColor: t.background },
    scroll:            { flexGrow: 1, paddingHorizontal: 28, paddingVertical: 24 },
    backButton:        { marginBottom: 32 },
    backText:          { fontSize: 16, color: t.primary, fontWeight: '500' },
    title:             { fontSize: 28, fontWeight: '800', color: t.text, marginBottom: 8 },
    subtitle:          { fontSize: 16, color: t.textSecondary, marginBottom: 32 },
    form:              { gap: 16 },
    field:             { gap: 6 },
    label:             { fontSize: 14, fontWeight: '600', color: t.textSecondary },
    input:             { backgroundColor: t.inputBg, borderWidth: 1.5, borderColor: t.inputBorder, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, color: t.text },
    primaryButton:     { backgroundColor: t.primary, borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 8 },
    buttonDisabled:    { opacity: 0.6 },
    primaryButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
    footer:            { flexDirection: 'row', justifyContent: 'center', marginTop: 32, paddingBottom: 16 },
    footerText:        { fontSize: 15, color: t.textSecondary },
    footerLink:        { fontSize: 15, color: t.primary, fontWeight: '600' },
  });
}
