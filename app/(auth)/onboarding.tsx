import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Image } from 'expo-image';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTheme, type Theme } from '@/constants/theme';

const SLIDES = [
  {
    icon:        'music' as const,
    iconColor:   '#6366F1',
    iconBg:      '#EEF2FF',
    title:       'Eventos para todos',
    description: 'Conciertos, festivales, fiestas... Descubre lo que pasa cerca de ti.',
  },
  {
    icon:        'users' as const,
    iconColor:   '#3B82F6',
    iconBg:      '#EFF6FF',
    title:       'Encuentra tu squad',
    description: 'Únete a grupos de gente que va al mismo evento. Nunca más vayas solo.',
  },
  {
    icon:        'map-marker' as const,
    iconColor:   '#EF4444',
    iconBg:      '#FEE2E2',
    title:       'Punto de encuentro',
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

        {/* Logo centrado */}
        <View style={s.logoWrapper}>
          <Image
            source={require('@/assets/images/icon.png')}
            style={s.logoImage}
            contentFit="contain"
          />
          <Text style={s.logoText}>EventSquad</Text>
          <Text style={s.logoSub}>Vive la música con tu gente</Text>
        </View>

        {/* Cards */}
        <View style={s.slides}>
          {SLIDES.map((slide) => (
            <View key={slide.title} style={s.slide}>
              <View style={[s.iconWrap, { backgroundColor: slide.iconBg }]}>
                <FontAwesome name={slide.icon} size={20} color={slide.iconColor} />
              </View>
              <View style={s.slideTextWrap}>
                <Text style={s.slideTitle}>{slide.title}</Text>
                <Text style={s.slideDesc}>{slide.description}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      <View style={s.actions}>
        <Pressable
          style={s.primaryButton}
          onPress={() => router.push('/(auth)/register')}
          accessibilityRole="button"
          accessibilityLabel="Crear cuenta"
        >
          <Text style={s.primaryButtonText}>Crear cuenta</Text>
        </Pressable>
        <Pressable
          style={s.secondaryButton}
          onPress={() => router.push('/(auth)/login')}
          accessibilityRole="button"
          accessibilityLabel="Ya tengo cuenta"
        >
          <Text style={s.secondaryButtonText}>Ya tengo cuenta</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

function makeStyles(t: Theme) {
  return StyleSheet.create({
    container:           { flex: 1, backgroundColor: t.background },
    content:             { flex: 1, paddingHorizontal: 28, paddingTop: 24 },

    // Logo — centrado y grande
    logoWrapper:         { alignItems: 'center', marginBottom: 40 },
    logoImage:           { width: 96, height: 96, marginBottom: 14 },
    logoText:            { fontSize: 32, fontWeight: '800', color: t.primary, letterSpacing: -0.5 },
    logoSub:             { fontSize: 14, color: t.textSecondary, marginTop: 4 },

    // Feature cards
    slides:              { gap: 14 },
    slide:               {
      flexDirection: 'row', alignItems: 'center', gap: 16,
      backgroundColor: t.surface, borderRadius: 16, padding: 18,
      shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
    },
    iconWrap:            { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    slideTextWrap:       { flex: 1 },
    slideTitle:          { fontSize: 15, fontWeight: '700', color: t.text, marginBottom: 3 },
    slideDesc:           { fontSize: 13, color: t.textSecondary, lineHeight: 19 },

    // Actions
    actions:             { paddingHorizontal: 28, paddingBottom: 24, gap: 12 },
    primaryButton:       { backgroundColor: t.primary, borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
    primaryButtonText:   { color: '#fff', fontSize: 16, fontWeight: '700' },
    secondaryButton:     { backgroundColor: t.primaryBg, borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
    secondaryButtonText: { color: t.primary, fontSize: 16, fontWeight: '600' },
  });
}
