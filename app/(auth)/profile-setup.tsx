import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  Alert,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { updateProfile, pickAndUploadAvatar } from '@/lib/auth';
import { useAuthStore } from '@/stores/authStore';

export default function ProfileSetupScreen() {
  const user = useAuthStore((s) => s.user);
  const profile = useAuthStore((s) => s.profile);
  const setProfile = useAuthStore((s) => s.setProfile);

  const [displayName, setDisplayName] = useState(profile?.display_name ?? '');
  const [bio, setBio] = useState(profile?.bio ?? '');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(profile?.avatar_url ?? null);
  const [loading, setLoading] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  async function handlePickAvatar() {
    if (!user) return;
    setUploadingAvatar(true);
    try {
      const url = await pickAndUploadAvatar(user.id);
      if (url) setAvatarUrl(url);
    } catch (e) {
      Alert.alert('Error al subir la foto', (e as Error).message);
    } finally {
      setUploadingAvatar(false);
    }
  }

  async function handleSave() {
    if (!user) return;
    if (!displayName.trim()) {
      Alert.alert('Nombre requerido', 'Escribe un nombre para tu perfil.');
      return;
    }

    setLoading(true);
    try {
      const updated = await updateProfile(user.id, {
        display_name: displayName.trim(),
        bio: bio.trim() || null,
        avatar_url: avatarUrl,
      });
      setProfile(updated);
      router.replace('/(auth)/verify-identity');
    } catch (e) {
      Alert.alert('Error al guardar', (e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  function handleSkipVerify() {
    router.replace('/(app)/(tabs)');
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.title}>Configura tu perfil</Text>
          <Text style={styles.subtitle}>
            Así te verán los demás cuando busquen compañeros de evento
          </Text>

          {/* Avatar */}
          <View style={styles.avatarSection}>
            <Pressable style={styles.avatarWrapper} onPress={handlePickAvatar} disabled={uploadingAvatar}>
              {avatarUrl ? (
                <Image source={{ uri: avatarUrl }} style={styles.avatar} contentFit="cover" />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarInitial}>
                    {displayName[0]?.toUpperCase() ?? '?'}
                  </Text>
                </View>
              )}
              <View style={styles.avatarEditBadge}>
                {uploadingAvatar ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.avatarEditIcon}>📷</Text>
                )}
              </View>
            </Pressable>
            <Text style={styles.avatarHint}>Toca para subir una foto</Text>
          </View>

          {/* Formulario */}
          <View style={styles.form}>
            <View style={styles.field}>
              <Text style={styles.label}>Nombre o apodo *</Text>
              <TextInput
                style={styles.input}
                value={displayName}
                onChangeText={setDisplayName}
                autoCapitalize="words"
                placeholder="¿Cómo te llaman?"
                placeholderTextColor="#9CA3AF"
                maxLength={50}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Sobre ti (opcional)</Text>
              <TextInput
                style={[styles.input, styles.textarea]}
                value={bio}
                onChangeText={setBio}
                multiline
                numberOfLines={4}
                placeholder="Cuéntanos algo sobre ti: qué música te gusta, qué eventos frecuentas..."
                placeholderTextColor="#9CA3AF"
                maxLength={200}
                textAlignVertical="top"
              />
              <Text style={styles.charCount}>{bio.length}/200</Text>
            </View>
          </View>
        </ScrollView>

        {/* Botones */}
        <View style={styles.actions}>
          <Pressable
            style={[styles.primaryButton, loading && styles.buttonDisabled]}
            onPress={handleSave}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.primaryButtonText}>Continuar → Verificar identidad</Text>
            )}
          </Pressable>

          <Pressable style={styles.skipButton} onPress={handleSkipVerify}>
            <Text style={styles.skipText}>Ahora no, entrar a la app</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' },
  scroll: { flexGrow: 1, paddingHorizontal: 28, paddingTop: 24, paddingBottom: 8 },
  title: { fontSize: 24, fontWeight: '800', color: '#111827', marginBottom: 8 },
  subtitle: { fontSize: 15, color: '#6B7280', marginBottom: 32, lineHeight: 22 },
  avatarSection: { alignItems: 'center', marginBottom: 32 },
  avatarWrapper: { position: 'relative' },
  avatar: { width: 100, height: 100, borderRadius: 50 },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#6366F1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: { fontSize: 40, color: '#fff', fontWeight: '700' },
  avatarEditBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#374151',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FAFAFA',
  },
  avatarEditIcon: { fontSize: 14 },
  avatarHint: { marginTop: 8, fontSize: 13, color: '#9CA3AF' },
  form: { gap: 20 },
  field: { gap: 6 },
  label: { fontSize: 14, fontWeight: '600', color: '#374151' },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#111827',
  },
  textarea: { minHeight: 100, paddingTop: 14 },
  charCount: { fontSize: 12, color: '#9CA3AF', textAlign: 'right', marginTop: 4 },
  actions: { paddingHorizontal: 28, paddingBottom: 24, gap: 10 },
  primaryButton: {
    backgroundColor: '#6366F1',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  buttonDisabled: { opacity: 0.6 },
  primaryButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  skipButton: { alignItems: 'center', paddingVertical: 12 },
  skipText: { fontSize: 14, color: '#9CA3AF' },
});
