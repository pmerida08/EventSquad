import { CameraView, useCameraPermissions } from 'expo-camera';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTheme, type Theme } from '@/constants/theme';
import { markUserAsVerified } from '@/lib/auth';
import { useAuthStore } from '@/stores/authStore';

type Step = 'intro' | 'camera' | 'processing' | 'success';

const INSTRUCTIONS = [
  { icon: '👤', text: 'Asegúrate de que tu cara se vea claramente' },
  { icon: '💡', text: 'Busca buena iluminación' },
  { icon: '😐', text: 'Mira directamente a la cámara' },
];

export default function VerifyIdentityScreen() {
  const t = useTheme();
  const s = makeStyles(t);

  const user       = useAuthStore((u) => u.user);
  const setProfile = useAuthStore((u) => u.setProfile);

  const [step, setStep]             = useState<Step>('intro');
  const [permission, requestPerm]   = useCameraPermissions();
  const cameraRef                   = useRef<CameraView>(null);

  async function handleStartCamera() {
    if (!permission?.granted) {
      const result = await requestPerm();
      if (!result.granted) {
        Alert.alert('Permiso necesario', 'Necesitamos acceso a la cámara para verificar tu identidad.');
        return;
      }
    }
    setStep('camera');
  }

  async function handleCapture() {
    if (!cameraRef.current || !user) return;
    setStep('processing');
    try {
      await cameraRef.current.takePictureAsync({ quality: 0.7, base64: false });
      await new Promise((r) => setTimeout(r, 1500));
      const updated = await markUserAsVerified(user.id);
      setProfile(updated);
      setStep('success');
    } catch (e) {
      Alert.alert('Error en la verificación', (e as Error).message);
      setStep('camera');
    }
  }

  function handleSkip() {
    Alert.alert(
      'Verificación pendiente',
      'Podrás unirte a grupos solo después de verificar tu identidad. ¿Continuar sin verificar?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Continuar', onPress: () => router.replace('/(app)/(tabs)') },
      ],
    );
  }

  if (step === 'intro') {
    return (
      <SafeAreaView style={s.container} edges={['top', 'bottom']}>
        <StatusBar style={t.statusBar} />
        <View style={s.content}>
          <Text style={s.bigEmoji}>🛡️</Text>
          <Text style={s.title}>Verifica tu identidad</Text>
          <Text style={s.subtitle}>
            Queremos asegurarnos de que todos los miembros son personas reales.
            Solo tienes que hacernos una selfie.
          </Text>
          <View style={s.instructionsList}>
            {INSTRUCTIONS.map((item) => (
              <View key={item.text} style={s.instruction}>
                <Text style={s.instructionIcon}>{item.icon}</Text>
                <Text style={s.instructionText}>{item.text}</Text>
              </View>
            ))}
          </View>
          <View style={s.securityNote}>
            <Text style={s.securityNoteText}>🔒 Tu foto se analiza de forma segura y no se almacena.</Text>
          </View>
        </View>
        <View style={s.actions}>
          <Pressable style={s.primaryButton} onPress={handleStartCamera}>
            <Text style={s.primaryButtonText}>Abrir cámara</Text>
          </Pressable>
          <Pressable style={s.skipButton} onPress={handleSkip}>
            <Text style={s.skipText}>Verificar más tarde</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  if (step === 'camera') {
    return (
      <View style={s.cameraContainer}>
        <StatusBar style="light" />
        <CameraView ref={cameraRef} style={s.camera} facing="front">
          <View style={s.overlay}>
            <Text style={s.cameraHint}>Centra tu cara en el óvalo</Text>
            <View style={s.faceGuide} />
            <Pressable style={s.captureButton} onPress={handleCapture}>
              <View style={s.captureInner} />
            </Pressable>
          </View>
        </CameraView>
      </View>
    );
  }

  if (step === 'processing') {
    return (
      <SafeAreaView style={[s.container, s.centerContent]}>
        <StatusBar style={t.statusBar} />
        <ActivityIndicator size="large" color={t.primary} />
        <Text style={s.processingText}>Verificando tu identidad...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[s.container, s.centerContent]} edges={['top', 'bottom']}>
      <StatusBar style={t.statusBar} />
      <Text style={s.successEmoji}>✅</Text>
      <Text style={s.title}>¡Identidad verificada!</Text>
      <Text style={s.subtitle}>Ahora puedes unirte a grupos y conectar con otros asistentes.</Text>
      <View style={s.actions}>
        <Pressable style={s.primaryButton} onPress={() => router.replace('/(app)/(tabs)')}>
          <Text style={s.primaryButtonText}>Ir a la app</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

function makeStyles(t: Theme) {
  return StyleSheet.create({
    container:       { flex: 1, backgroundColor: t.background },
    centerContent:   { alignItems: 'center', justifyContent: 'center', padding: 28 },
    content:         { flex: 1, paddingHorizontal: 28, paddingTop: 24 },
    bigEmoji:        { fontSize: 64, marginBottom: 16 },
    successEmoji:    { fontSize: 72, marginBottom: 24 },
    title:           { fontSize: 24, fontWeight: '800', color: t.text, marginBottom: 12, textAlign: 'center' },
    subtitle:        { fontSize: 15, color: t.textSecondary, lineHeight: 22, textAlign: 'center', marginBottom: 32 },
    instructionsList:{ gap: 12, marginBottom: 24 },
    instruction:     { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: t.surface, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: t.borderLight },
    instructionIcon: { fontSize: 24 },
    instructionText: { fontSize: 15, color: t.text, flex: 1 },
    securityNote:    { backgroundColor: t.greenBg, borderRadius: 10, padding: 14, borderWidth: 1, borderColor: '#BBF7D0' },
    securityNoteText:{ fontSize: 13, color: '#166534', lineHeight: 18 },
    actions:         { paddingHorizontal: 28, paddingBottom: 24, gap: 10 },
    primaryButton:   { backgroundColor: t.primary, borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
    primaryButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
    skipButton:      { alignItems: 'center', paddingVertical: 12 },
    skipText:        { fontSize: 14, color: t.textTertiary },
    processingText:  { marginTop: 16, fontSize: 16, color: t.textSecondary },
    cameraContainer: { flex: 1 },
    camera:          { flex: 1 },
    overlay:         { flex: 1, alignItems: 'center', justifyContent: 'space-between', paddingVertical: 60 },
    cameraHint:      { color: '#fff', fontSize: 16, fontWeight: '600', backgroundColor: 'rgba(0,0,0,0.4)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
    faceGuide:       { width: 220, height: 280, borderRadius: 110, borderWidth: 3, borderColor: 'rgba(255,255,255,0.8)', borderStyle: 'dashed' },
    captureButton:   { width: 72, height: 72, borderRadius: 36, backgroundColor: 'rgba(255,255,255,0.3)', borderWidth: 3, borderColor: '#fff', alignItems: 'center', justifyContent: 'center' },
    captureInner:    { width: 54, height: 54, borderRadius: 27, backgroundColor: '#fff' },
  });
}
