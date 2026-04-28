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
import { signInWithEmail, signInWithMagicLink } from '@/lib/auth';

export default function LoginScreen() {
  const t = useTheme();
  const s = makeStyles(t);

  const [email, setEmail]               = useState('');
  const [password, setPassword]         = useState('');
  const [loading, setLoading]           = useState(false);
  const [magicLinkSent, setMagicLink]   = useState(false);

  async function handleSignIn() {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Campos requeridos', 'Introduce tu email y contraseña.');
      return;
    }
    setLoading(true);
    try {
      await signInWithEmail(email.trim().toLowerCase(), password);
    } catch (e) {
      Alert.alert('Error al iniciar sesión', (e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function handleMagicLink() {
    if (!email.trim()) {
      Alert.alert('Email requerido', 'Introduce tu email para recibir el enlace.');
      return;
    }
    setLoading(true);
    try {
      await signInWithMagicLink(email.trim().toLowerCase());
      setMagicLink(true);
    } catch (e) {
      Alert.alert('Error', (e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  if (magicLinkSent) {
    return (
      <SafeAreaView style={s.container}>
        <StatusBar style={t.statusBar} />
        <View style={s.centerContent}>
          <Text style={s.bigEmoji}>📬</Text>
          <Text style={s.title}>Revisa tu email</Text>
          <Text style={s.subtitle}>
            Hemos enviado un enlace mágico a{'\n'}
            <Text style={s.emailHighlight}>{email}</Text>
          </Text>
          <Pressable onPress={() => setMagicLink(false)} style={s.linkButton}>
            <Text style={s.linkText}>Usar contraseña en su lugar</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.container}>
      <StatusBar style={t.statusBar} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
          <Pressable onPress={() => router.back()} style={s.backButton}>
            <Text style={s.backText}>← Atrás</Text>
          </Pressable>

          <Text style={s.title}>Bienvenido de nuevo</Text>
          <Text style={s.subtitle}>Inicia sesión en tu cuenta</Text>

          <View style={s.form}>
            <View style={s.field}>
              <Text style={s.label}>Email</Text>
              <TextInput
                style={s.input}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                textContentType="emailAddress"
                placeholder="tú@ejemplo.com"
                placeholderTextColor={t.textTertiary}
              />
            </View>

            <View style={s.field}>
              <Text style={s.label}>Contraseña</Text>
              <TextInput
                style={s.input}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                textContentType="password"
                placeholder="••••••••"
                placeholderTextColor={t.textTertiary}
              />
            </View>

            <Pressable
              style={[s.primaryButton, loading && s.buttonDisabled]}
              onPress={handleSignIn}
              disabled={loading}
            >
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.primaryButtonText}>Iniciar sesión</Text>}
            </Pressable>

            <View style={s.divider}>
              <View style={s.dividerLine} />
              <Text style={s.dividerText}>o</Text>
              <View style={s.dividerLine} />
            </View>

            <Pressable style={s.magicLinkButton} onPress={handleMagicLink} disabled={loading}>
              <Text style={s.magicLinkText}>✨ Enviarme un enlace mágico</Text>
            </Pressable>
          </View>

          <View style={s.footer}>
            <Text style={s.footerText}>¿No tienes cuenta? </Text>
            <Pressable onPress={() => router.replace('/(auth)/register')}>
              <Text style={s.footerLink}>Regístrate</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function makeStyles(t: Theme) {
  return StyleSheet.create({
    container:      { flex: 1, backgroundColor: t.background },
    scroll:         { flexGrow: 1, paddingHorizontal: 28, paddingVertical: 24 },
    backButton:     { marginBottom: 32 },
    backText:       { fontSize: 16, color: t.primary, fontWeight: '500' },
    title:          { fontSize: 28, fontWeight: '800', color: t.text, marginBottom: 8 },
    subtitle:       { fontSize: 16, color: t.textSecondary, marginBottom: 32 },
    form:           { gap: 16 },
    field:          { gap: 6 },
    label:          { fontSize: 14, fontWeight: '600', color: t.textSecondary },
    input:          { backgroundColor: t.inputBg, borderWidth: 1.5, borderColor: t.inputBorder, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, color: t.text },
    primaryButton:  { backgroundColor: t.primary, borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 8 },
    buttonDisabled: { opacity: 0.6 },
    primaryButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
    divider:        { flexDirection: 'row', alignItems: 'center', gap: 12 },
    dividerLine:    { flex: 1, height: 1, backgroundColor: t.border },
    dividerText:    { fontSize: 14, color: t.textTertiary },
    magicLinkButton:{ backgroundColor: t.surface2, borderWidth: 1.5, borderColor: t.border, borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
    magicLinkText:  { color: t.text, fontSize: 15, fontWeight: '600' },
    footer:         { flexDirection: 'row', justifyContent: 'center', marginTop: 32, paddingBottom: 16 },
    footerText:     { fontSize: 15, color: t.textSecondary },
    footerLink:     { fontSize: 15, color: t.primary, fontWeight: '600' },
    centerContent:  { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 28 },
    bigEmoji:       { fontSize: 64, marginBottom: 24 },
    emailHighlight: { fontWeight: '700', color: t.text },
    linkButton:     { marginTop: 24 },
    linkText:       { color: t.primary, fontSize: 15, fontWeight: '500' },
  });
}
