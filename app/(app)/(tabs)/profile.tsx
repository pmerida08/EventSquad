import { Image } from 'expo-image';
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
import { signOut } from '@/lib/auth';
import { useAuthStore } from '@/stores/authStore';

export default function ProfileScreen() {
  const profile = useAuthStore((s) => s.profile);
  const user = useAuthStore((s) => s.user);
  const signOutStore = useAuthStore((s) => s.signOut);

  if (!profile) {
    return (
      <SafeAreaView style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#6366F1" />
      </SafeAreaView>
    );
  }

  async function handleSignOut() {
    Alert.alert('Cerrar sesión', '¿Seguro que quieres salir?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Cerrar sesión',
        style: 'destructive',
        onPress: async () => {
          await signOut();
          signOutStore();
        },
      },
    ]);
  }

  function handleEditProfile() {
    router.push('/(auth)/profile-setup');
  }

  function handleVerify() {
    router.push('/(auth)/verify-identity');
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Mi perfil</Text>
          <Pressable onPress={handleEditProfile} style={styles.editButton}>
            <Text style={styles.editButtonText}>Editar</Text>
          </Pressable>
        </View>

        {/* Avatar + nombre */}
        <View style={styles.profileCard}>
          <View style={styles.avatarWrapper}>
            {profile.avatar_url ? (
              <Image
                source={{ uri: profile.avatar_url }}
                style={styles.avatar}
                contentFit="cover"
              />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarInitial}>
                  {profile.display_name[0]?.toUpperCase() ?? '?'}
                </Text>
              </View>
            )}
          </View>

          <Text style={styles.displayName}>{profile.display_name}</Text>
          <Text style={styles.email}>{user?.email}</Text>

          <View style={styles.badges}>
            {profile.verified ? (
              <VerifiedBadge size="md" />
            ) : (
              <Pressable style={styles.unverifiedBadge} onPress={handleVerify}>
                <Text style={styles.unverifiedText}>⚠️ No verificado — Verificar ahora</Text>
              </Pressable>
            )}
          </View>
        </View>

        {/* Bio */}
        {profile.bio ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Sobre mí</Text>
            <Text style={styles.bio}>{profile.bio}</Text>
          </View>
        ) : (
          <Pressable style={styles.emptyBioCard} onPress={handleEditProfile}>
            <Text style={styles.emptyBioText}>+ Añadir una bio</Text>
          </Pressable>
        )}

        {/* Banner de verificación */}
        {!profile.verified && (
          <Pressable style={styles.verifyBanner} onPress={handleVerify}>
            <Text style={styles.verifyBannerTitle}>🛡️ Verifica tu identidad</Text>
            <Text style={styles.verifyBannerText}>
              Necesitas verificarte para unirte a grupos de eventos. Solo tarda 30 segundos.
            </Text>
            <Text style={styles.verifyBannerCta}>Verificar ahora →</Text>
          </Pressable>
        )}

        {/* Información de cuenta */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cuenta</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Email</Text>
              <Text style={styles.infoValue} numberOfLines={1}>{user?.email}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Miembro desde</Text>
              <Text style={styles.infoValue}>
                {new Date(profile.created_at).toLocaleDateString('es-ES', {
                  month: 'long',
                  year: 'numeric',
                })}
              </Text>
            </View>
          </View>
        </View>

        {/* Cerrar sesión */}
        <Pressable style={styles.signOutButton} onPress={handleSignOut}>
          <Text style={styles.signOutText}>Cerrar sesión</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  center: { alignItems: 'center', justifyContent: 'center' },
  scroll: { paddingHorizontal: 20, paddingBottom: 40 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
  },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#111827' },
  editButton: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
  },
  editButtonText: { color: '#6366F1', fontWeight: '600', fontSize: 14 },
  profileCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  avatarWrapper: { marginBottom: 16 },
  avatar: { width: 90, height: 90, borderRadius: 45 },
  avatarPlaceholder: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#6366F1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: { fontSize: 36, color: '#fff', fontWeight: '700' },
  displayName: { fontSize: 22, fontWeight: '700', color: '#111827', marginBottom: 4 },
  email: { fontSize: 14, color: '#9CA3AF', marginBottom: 12 },
  badges: { flexDirection: 'row', gap: 8 },
  unverifiedBadge: {
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FCD34D',
    borderRadius: 99,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  unverifiedText: { fontSize: 12, color: '#92400E', fontWeight: '600' },
  section: { marginBottom: 16 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },
  bio: { fontSize: 15, color: '#374151', lineHeight: 22, backgroundColor: '#fff', borderRadius: 12, padding: 16 },
  emptyBioCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyBioText: { color: '#9CA3AF', fontSize: 15 },
  verifyBanner: {
    backgroundColor: '#EEF2FF',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#C7D2FE',
    marginBottom: 16,
  },
  verifyBannerTitle: { fontSize: 16, fontWeight: '700', color: '#3730A3', marginBottom: 6 },
  verifyBannerText: { fontSize: 14, color: '#4338CA', lineHeight: 20, marginBottom: 10 },
  verifyBannerCta: { fontSize: 14, fontWeight: '700', color: '#6366F1' },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    overflow: 'hidden',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
  },
  divider: { height: 1, backgroundColor: '#F3F4F6' },
  infoLabel: { fontSize: 14, color: '#6B7280' },
  infoValue: { fontSize: 14, color: '#111827', fontWeight: '500', maxWidth: '60%', textAlign: 'right' },
  signOutButton: {
    marginTop: 8,
    backgroundColor: '#FEF2F2',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  signOutText: { color: '#DC2626', fontSize: 16, fontWeight: '600' },
});
