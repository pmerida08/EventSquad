import { router } from 'expo-router';
import { View, Text, StyleSheet, Pressable, Image, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const SLIDES = [
  {
    emoji: '🎵',
    title: 'Eventos para todos',
    description: 'Conciertos, festivales, fiestas... Descubre lo que pasa cerca de ti.',
  },
  {
    emoji: '👥',
    title: 'Encuentra tu squad',
    description: 'Únete a grupos de gente que va al mismo evento. Nunca más vayas solo.',
  },
  {
    emoji: '📍',
    title: 'Punto de encuentro',
    description: 'Votad juntos dónde y cuándo quedar antes del evento.',
  },
];

export default function OnboardingScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.content}>
        {/* Logo */}
        <View style={styles.logoWrapper}>
          <Text style={styles.logoEmoji}>⚡</Text>
          <Text style={styles.logoText}>EventSquad</Text>
        </View>

        {/* Cards de funcionalidades */}
        <View style={styles.slides}>
          {SLIDES.map((slide) => (
            <View key={slide.title} style={styles.slide}>
              <Text style={styles.slideEmoji}>{slide.emoji}</Text>
              <View style={styles.slideText}>
                <Text style={styles.slideTitle}>{slide.title}</Text>
                <Text style={styles.slideDesc}>{slide.description}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* Botones de acción */}
      <View style={styles.actions}>
        <Pressable
          style={styles.primaryButton}
          onPress={() => router.push('/(auth)/register')}
        >
          <Text style={styles.primaryButtonText}>Crear cuenta</Text>
        </Pressable>

        <Pressable
          style={styles.secondaryButton}
          onPress={() => router.push('/(auth)/login')}
        >
          <Text style={styles.secondaryButtonText}>Ya tengo cuenta</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  content: {
    flex: 1,
    paddingHorizontal: 28,
    paddingTop: 32,
  },
  logoWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 48,
  },
  logoEmoji: { fontSize: 32 },
  logoText: {
    fontSize: 28,
    fontWeight: '800',
    color: '#6366F1',
    letterSpacing: -0.5,
  },
  slides: { gap: 24 },
  slide: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  slideEmoji: { fontSize: 36 },
  slideText: { flex: 1 },
  slideTitle: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 4 },
  slideDesc: { fontSize: 14, color: '#6B7280', lineHeight: 20 },
  actions: {
    paddingHorizontal: 28,
    paddingBottom: 24,
    gap: 12,
  },
  primaryButton: {
    backgroundColor: '#6366F1',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryButton: {
    backgroundColor: '#EEF2FF',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#6366F1',
    fontSize: 16,
    fontWeight: '600',
  },
});
