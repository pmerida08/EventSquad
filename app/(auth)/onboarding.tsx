import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTheme, type Theme } from '@/constants/theme';

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
  const t = useTheme();
  const s = makeStyles(t);

  return (
    <SafeAreaView style={s.container}>
      <StatusBar style={t.statusBar} />

      <View style={s.content}>
        {/* Logo */}
        <View style={s.logoWrapper}>
          <Text style={s.logoEmoji}>⚡</Text>
          <Text style={s.logoText}>EventSquad</Text>
        </View>

        {/* Cards */}
        <View style={s.slides}>
          {SLIDES.map((slide) => (
            <View key={slide.title} style={s.slide}>
              <Text style={s.slideEmoji}>{slide.emoji}</Text>
              <View style={s.slideTextWrap}>
                <Text style={s.slideTitle}>{slide.title}</Text>
                <Text style={s.slideDesc}>{slide.description}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      <View style={s.actions}>
        <Pressable style={s.primaryButton} onPress={() => router.push('/(auth)/register')}>
          <Text style={s.primaryButtonText}>Crear cuenta</Text>
        </Pressable>
        <Pressable style={s.secondaryButton} onPress={() => router.push('/(auth)/login')}>
          <Text style={s.secondaryButtonText}>Ya tengo cuenta</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

function makeStyles(t: Theme) {
  return StyleSheet.create({
    container:        { flex: 1, backgroundColor: t.background },
    content:          { flex: 1, paddingHorizontal: 28, paddingTop: 32 },
    logoWrapper:      { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 48 },
    logoEmoji:        { fontSize: 32 },
    logoText:         { fontSize: 28, fontWeight: '800', color: t.primary, letterSpacing: -0.5 },
    slides:           { gap: 24 },
    slide:            { flexDirection: 'row', alignItems: 'flex-start', gap: 16, backgroundColor: t.surface, borderRadius: 16, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
    slideEmoji:       { fontSize: 36 },
    slideTextWrap:    { flex: 1 },
    slideTitle:       { fontSize: 16, fontWeight: '700', color: t.text, marginBottom: 4 },
    slideDesc:        { fontSize: 14, color: t.textSecondary, lineHeight: 20 },
    actions:          { paddingHorizontal: 28, paddingBottom: 24, gap: 12 },
    primaryButton:    { backgroundColor: t.primary, borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
    primaryButtonText:{ color: '#fff', fontSize: 16, fontWeight: '700' },
    secondaryButton:  { backgroundColor: t.primaryBg, borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
    secondaryButtonText: { color: t.primary, fontSize: 16, fontWeight: '600' },
  });
}
