import { Image } from 'expo-image';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { VerifiedBadge } from '@/components/ui/VerifiedBadge';
import { useTheme, type Theme } from '@/constants/theme';
import { signOut } from '@/lib/auth';
import { useAuthStore } from '@/stores/authStore';

export default function ProfileScreen() {
  const t          = useTheme();
  const s          = makeStyles(t);
  const profile    = useAuthStore((s) => s.profile);
  const user       = useAuthStore((s) => s.user);
  const signOutStore = useAuthStore((s) => s.signOut);

  if (!profile) {
    return (
      <SafeAreaView style={[s.container, s.center]}>
        <StatusBar style={t.statusBar} />
        <ActivityIndicator size="large" color={t.primary} />
      </SafeAreaView>
    );
  }

  async function handleSignOut() {
    Alert.alert('Cerrar sesión', '¿Seguro que quieres salir?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Cerrar sesión',
        style: 'destructive',
        onPress: async () => { await signOut(); signOutStore(); },
      },
    ]);
  }

  return (
    <SafeAreaView style={s.container}>
      <StatusBar style={t.statusBar} />
      <ScrollView contentContainerStyle={s.scroll}>
        {/* Header */}
        <View style={s.header}>
          <Text style={s.headerTitle}>Mi perfil</Text>
          <Pressable onPress={() => router.push('/(auth)/profile-setup')} style={s.editButton}>
            <Text style={s.editButtonText}>Editar</Text>
          </Pressable>
        </View>

        {/* Avatar + nombre */}
        <View style={s.profileCard}>
          <View style={s.avatarWrapper}>
            {profile.avatar_url ? (
              <Image source={{ uri: profile.avatar_url }} style={s.avatar} contentFit="cover" />
            ) : (
              <View style={s.avatarPlaceholder}>
                <Text style={s.avatarInitial}>{profile.display_name[0]?.toUpperCase() ?? '?'}</Text>
              </View>
            )}
          </View>
          <Text style={s.displayName}>{profile.display_name}</Text>
          <Text style={s.email}>{user?.email}</Text>
          <View style={s.badges}>
            {profile.verified ? (
              <VerifiedBadge size="md" />
            ) : (
              <Pressable style={s.unverifiedBadge} onPress={() => router.push('/(auth)/verify-identity')}>
                <Text style={s.unverifiedText}>⚠️ No verificado — Verificar ahora</Text>
              </Pressable>
            )}
          </View>
        </View>

        {/* Bio */}
        {profile.bio ? (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Sobre mí</Text>
            <Text style={s.bio}>{profile.bio}</Text>
          </View>
        ) : (
          <Pressable style={s.emptyBioCard} onPress={() => router.push('/(auth)/profile-setup')}>
            <Text style={s.emptyBioText}>+ Añadir una bio</Text>
          </Pressable>
        )}

        {/* Banner verificación */}
        {!profile.verified && (
          <Pressable style={s.verifyBanner} onPress={() => router.push('/(auth)/verify-identity')}>
            <Text style={s.verifyBannerTitle}>🛡️ Verifica tu identidad</Text>
            <Text style={s.verifyBannerText}>
              Necesitas verificarte para unirte a grupos de eventos. Solo tarda 30 segundos.
            </Text>
            <Text style={s.verifyBannerCta}>Verificar ahora →</Text>
          </Pressable>
        )}

        {/* Cuenta */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Cuenta</Text>
          <View style={s.infoCard}>
            <View style={s.infoRow}>
              <Text style={s.infoLabel}>Email</Text>
              <Text style={s.infoValue} numberOfLines={1}>{user?.email}</Text>
            </View>
            <View style={s.divider} />
            <View style={s.infoRow}>
              <Text style={s.infoLabel}>Miembro desde</Text>
              <Text style={s.infoValue}>
                {new Date(profile.created_at).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
              </Text>
            </View>
          </View>
        </View>

        <Pressable style={s.signOutButton} onPress={handleSignOut}>
          <Text style={s.signOutText}>Cerrar sesión</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function makeStyles(t: Theme) {
  return StyleSheet.create({
    container:      { flex: 1, backgroundColor: t.background },
    center:         { alignItems: 'center', justifyContent: 'center' },
    scroll:         { paddingHorizontal: 20, paddingBottom: 40 },
    header:         { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16 },
    headerTitle:    { fontSize: 22, fontWeight: '800', color: t.text },
    editButton:     { backgroundColor: t.primaryBg, paddingHorizontal: 14, paddingVertical: 7, borderRadius: 8 },
    editButtonText: { color: t.primary, fontWeight: '600', fontSize: 14 },
    profileCard:    { backgroundColor: t.surface, borderRadius: 20, padding: 24, alignItems: 'center', marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
    avatarWrapper:  { marginBottom: 16 },
    avatar:         { width: 90, height: 90, borderRadius: 45 },
    avatarPlaceholder: { width: 90, height: 90, borderRadius: 45, backgroundColor: t.primary, alignItems: 'center', justifyContent: 'center' },
    avatarInitial:  { fontSize: 36, color: '#fff', fontWeight: '700' },
    displayName:    { fontSize: 22, fontWeight: '700', color: t.text, marginBottom: 4 },
    email:          { fontSize: 14, color: t.textTertiary, marginBottom: 12 },
    badges:         { flexDirection: 'row', gap: 8 },
    unverifiedBadge:{ backgroundColor: t.amberBg, borderWidth: 1, borderColor: '#FCD34D', borderRadius: 99, paddingHorizontal: 10, paddingVertical: 4 },
    unverifiedText: { fontSize: 12, color: '#92400E', fontWeight: '600' },
    section:        { marginBottom: 16 },
    sectionTitle:   { fontSize: 13, fontWeight: '700', color: t.textTertiary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },
    bio:            { fontSize: 15, color: t.text, lineHeight: 22, backgroundColor: t.surface, borderRadius: 12, padding: 16 },
    emptyBioCard:   { backgroundColor: t.surface, borderRadius: 12, padding: 16, borderWidth: 1.5, borderColor: t.border, borderStyle: 'dashed', alignItems: 'center', marginBottom: 16 },
    emptyBioText:   { color: t.textTertiary, fontSize: 15 },
    verifyBanner:   { backgroundColor: t.primaryBg, borderRadius: 16, padding: 20, borderWidth: 1, borderColor: '#C7D2FE', marginBottom: 16 },
    verifyBannerTitle: { fontSize: 16, fontWeight: '700', color: '#3730A3', marginBottom: 6 },
    verifyBannerText:  { fontSize: 14, color: '#4338CA', lineHeight: 20, marginBottom: 10 },
    verifyBannerCta:   { fontSize: 14, fontWeight: '700', color: t.primary },
    infoCard:       { backgroundColor: t.surface, borderRadius: 12, paddingHorizontal: 16, overflow: 'hidden' },
    infoRow:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14 },
    divider:        { height: 1, backgroundColor: t.borderLight },
    infoLabel:      { fontSize: 14, color: t.textSecondary },
    infoValue:      { fontSize: 14, color: t.text, fontWeight: '500', maxWidth: '60%', textAlign: 'right' },
    signOutButton:  { marginTop: 8, backgroundColor: t.redBg, borderRadius: 14, paddingVertical: 16, alignItems: 'center', borderWidth: 1, borderColor: '#FECACA' },
    signOutText:    { color: t.red, fontSize: 16, fontWeight: '600' },
  });
}
