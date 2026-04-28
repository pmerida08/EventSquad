import { CameraView, useCameraPermissions } from 'expo-camera';
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

import { markUserAsVerified } from '@/lib/auth';
import { useAuthStore } from '@/stores/authStore';

type Step = 'intro' | 'camera' | 'processing' | 'success';

const INSTRUCTIONS = [
  { icon: '👤', text: 'Asegúrate de que tu cara se vea claramente' },
  { icon: '💡', text: 'Busca buena iluminación' },
  { icon: '😐', text: 'Mira directamente a la cámara' },
];

export default function VerifyIdentityScreen() {
  const user = useAuthStore((s) => s.user);
  const setProfile = useAuthStore((s) => s.setProfile);

  const [step, setStep] = useState<Step>('intro');
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);

  async function handleStartCamera() {
    if (!permission?.granted) {
      const result = await requestPermission();
      if (!result.granted) {
        Alert.alert(
          'Permiso necesario',
          'Necesitamos acceso a la cámara para verificar tu identidad.',
        );
        return;
      }
    }
    setStep('camera');
  }

  async function handleCapture() {
    if (!cameraRef.current || !user) return;
    setStep('processing');

    try {
      // Capturamos la foto (en producción aquí iría la llamada a AWS Rekognition,
      // Veriff o similar para el liveness check real)
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.7,
        base64: false,
      });

      if (!photo) throw new Error('No se pudo capturar la imagen.');

      // Simulación del análisis (300ms para UX fluida)
      await new Promise((r) => setTimeout(r, 1500));

      // TODO: Aquí iría la llamada al servicio de liveness check externo
      // Por ahora, marcamos como verificado directamente tras capturar la selfie
      const updated = await markUserAsVerified(user.id);
      setProfile(updated);
      setStep('success');
    } catch (e) {
      Alert.alert('Error en la verificación', (e as Error).message);
      setStep('camera');
    }
  }

  function handleContinue() {
    router.replace('/(app)/(tabs)');
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

  // ── Paso 1: Intro ──────────────────────────────────────────────────────────
  if (step === 'intro') {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <View style={styles.content}>
          <Text style={styles.bigEmoji}>🛡️</Text>
          <Text style={styles.title}>Verifica tu identidad</Text>
          <Text style={styles.subtitle}>
            Queremos asegurarnos de que todos los miembros son personas reales.
            Solo tienes que hacernos una selfie.
          </Text>

          <View style={styles.instructionsList}>
            {INSTRUCTIONS.map((item) => (
              <View key={item.text} style={styles.instruction}>
                <Text style={styles.instructionIcon}>{item.icon}</Text>
                <Text style={styles.instructionText}>{item.text}</Text>
              </View>
            ))}
          </View>

          <View style={styles.securityNote}>
            <Text style={styles.securityNoteText}>
              🔒 Tu foto se analiza de forma segura y no se almacena.
            </Text>
          </View>
        </View>

        <View style={styles.actions}>
          <Pressable style={styles.primaryButton} onPress={handleStartCamera}>
            <Text style={styles.primaryButtonText}>Abrir cámara</Text>
          </Pressable>
          <Pressable style={styles.skipButton} onPress={handleSkip}>
            <Text style={styles.skipText}>Verificar más tarde</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  // ── Paso 2: Cámara ─────────────────────────────────────────────────────────
  if (step === 'camera') {
    return (
      <View style={styles.cameraContainer}>
        <CameraView
          ref={cameraRef}
          style={styles.camera}
          facing="front"
        >
          {/* Guía de encuadre */}
          <View style={styles.overlay}>
            <Text style={styles.cameraHint}>Centra tu cara en el óvalo</Text>
            <View style={styles.faceGuide} />
            <Pressable style={styles.captureButton} onPress={handleCapture}>
              <View style={styles.captureInner} />
            </Pressable>
          </View>
        </CameraView>
      </View>
    );
  }

  // ── Paso 3: Procesando ─────────────────────────────────────────────────────
  if (step === 'processing') {
    return (
      <SafeAreaView style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#6366F1" />
        <Text style={styles.processingText}>Verificando tu identidad...</Text>
      </SafeAreaView>
    );
  }

  // ── Paso 4: Éxito ──────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={[styles.container, styles.centerContent]} edges={['bottom']}>
      <Text style={styles.successEmoji}>✅</Text>
      <Text style={styles.title}>¡Identidad verificada!</Text>
      <Text style={styles.subtitle}>
        Ahora puedes unirte a grupos y conectar con otros asistentes.
      </Text>
      <View style={styles.actions}>
        <Pressable style={styles.primaryButton} onPress={handleContinue}>
          <Text style={styles.primaryButtonText}>Ir a la app</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' },
  centerContent: { alignItems: 'center', justifyContent: 'center', padding: 28 },
  content: { flex: 1, paddingHorizontal: 28, paddingTop: 24 },
  bigEmoji: { fontSize: 64, marginBottom: 16 },
  successEmoji: { fontSize: 72, marginBottom: 24 },
  title: { fontSize: 24, fontWeight: '800', color: '#111827', marginBottom: 12, textAlign: 'center' },
  subtitle: { fontSize: 15, color: '#6B7280', lineHeight: 22, textAlign: 'center', marginBottom: 32 },
  instructionsList: { gap: 12, marginBottom: 24 },
  instruction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  instructionIcon: { fontSize: 24 },
  instructionText: { fontSize: 15, color: '#374151', flex: 1 },
  securityNote: {
    backgroundColor: '#F0FDF4',
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  securityNoteText: { fontSize: 13, color: '#166534', lineHeight: 18 },
  actions: { paddingHorizontal: 28, paddingBottom: 24, gap: 10 },
  primaryButton: {
    backgroundColor: '#6366F1',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  primaryButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  skipButton: { alignItems: 'center', paddingVertical: 12 },
  skipText: { fontSize: 14, color: '#9CA3AF' },
  processingText: { marginTop: 16, fontSize: 16, color: '#6B7280' },
  // Cámara
  cameraContainer: { flex: 1 },
  camera: { flex: 1 },
  overlay: { flex: 1, alignItems: 'center', justifyContent: 'space-between', paddingVertical: 60 },
  cameraHint: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    backgroundColor: 'rgba(0,0,0,0.4)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  faceGuide: {
    width: 220,
    height: 280,
    borderRadius: 110,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.8)',
    borderStyle: 'dashed',
  },
  captureButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderWidth: 3,
    borderColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureInner: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#fff',
  },
});
