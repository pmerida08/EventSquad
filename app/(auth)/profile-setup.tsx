import { Image } from 'expo-image';
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
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTheme, type Theme } from '@/constants/theme';
import { updateProfile, pickAndUploadAvatar } from '@/lib/auth';
import { useAuthStore } from '@/stores/authStore';

export default function ProfileSetupScreen() {
  const t = useTheme();
  const s = makeStyles(t);

  const user       = useAuthStore((s) => s.user);
  const profile    = useAuthStore((s) => s.profile);
  const setProfile = useAuthStore((s) => s.setProfile);

  const [displayName, setDisplayName]       = useState(profile?.display_name ?? '');
  const [bio, setBio]                       = useState(profile?.bio ?? '');
  const [avatarUrl, setAvatarUrl]           = useState<string | null>(profile?.avatar_url ?? null);
  const [loading, setLoading]               = useState(false);
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

  return (
    <SafeAreaView style={s.container} edges={['top', 'bottom']}>
      <StatusBar style={t.statusBar} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
          <Text style={s.title}>Configura tu perfil</Text>
          <Text style={s.subtitle}>Así te verán los demás cuando busquen compañeros de evento</Text>

          {/* Avatar */}
          <View style={s.avatarSection}>
            <Pressable style={s.avatarWrapper} onPress={handlePickAvatar} disabled={uploadingAvatar}>
              {avatarUrl ? (
                <Image source={{ uri: avatarUrl }} style={s.avatar} contentFit="cover" />
              ) : (
                <View style={s.avatarPlaceholder}>
                  <Text style={s.avatarInitial}>{displayName[0]?.toUpperCase() ?? '?'}</Text>
                </View>
              )}
              <View style={s.avatarEditBadge}>
                {uploadingAvatar
                  ? <ActivityIndicator size="small" color="#fff" />
                  : <Text style={s.avatarEditIcon}>📷</Text>
                }
              </View>
            </Pressable>
            <Text style={s.avatarHint}>Toca para subir una foto</Text>
          </View>

          {/* Form */}
          <View style={s.form}>
            <View style={s.field}>
              <Text style={s.label}>Nombre o apodo *</Text>
              <TextInput
                style={s.input}
                value={displayName}
                onChangeText={setDisplayName}
                autoCapitalize="words"
                placeholder="¿Cómo te llaman?"
                placeholderTextColor={t.textTertiary}
                maxLength={50}
              />
            </View>
            <View style={s.field}>
              <Text style={s.label}>Sobre ti (opcional)</Text>
              <TextInput
                style={[s.input, s.textarea]}
                value={bio}
                onChangeText={setBio}
                multiline
                numberOfLines={4}
                placeholder="Cuéntanos algo sobre ti: qué música te gusta, qué eventos frecuentas..."
                placeholderTextColor={t.textTertiary}
                maxLength={200}
                textAlignVertical="top"
              />
              <Text style={s.charCount}>{bio.length}/200</Text>
            </View>
          </View>
        </ScrollView>

        <View style={s.actions}>
          <Pressable style={[s.primaryButton, loading && s.buttonDisabled]} onPress={handleSave} disabled={loading}>
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={s.primaryButtonText}>Continuar → Verificar identidad</Text>
            }
          </Pressable>
          <Pressable style={s.skipButton} onPress={() => router.replace('/(app)/(tabs)')}>
            <Text style={s.skipText}>Ahora no, entrar a la app</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function makeStyles(t: Theme) {
  return StyleSheet.create({
    container:      { flex: 1, backgroundColor: t.background },
    scroll:         { flexGrow: 1, paddingHorizontal: 28, paddingTop: 24, paddingBottom: 8 },
    title:          { fontSize: 24, fontWeight: '800', color: t.text, marginBottom: 8 },
    subtitle:       { fontSize: 15, color: t.textSecondary, marginBottom: 32, lineHeight: 22 },
    avatarSection:  { alignItems: 'center', marginBottom: 32 },
    avatarWrapper:  { position: 'relative' },
    avatar:         { width: 100, height: 100, borderRadius: 50 },
    avatarPlaceholder: { width: 100, height: 100, borderRadius: 50, backgroundColor: t.primary, alignItems: 'center', justifyContent: 'center' },
    avatarInitial:  { fontSize: 40, color: '#fff', fontWeight: '700' },
    avatarEditBadge:{ position: 'absolute', bottom: 0, right: 0, width: 32, height: 32, borderRadius: 16, backgroundColor: t.surface2, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: t.background },
    avatarEditIcon: { fontSize: 14 },
    avatarHint:     { marginTop: 8, fontSize: 13, color: t.textTertiary },
    form:           { gap: 20 },
    field:          { gap: 6 },
    label:          { fontSize: 14, fontWeight: '600', color: t.textSecondary },
    input:          { backgroundColor: t.inputBg, borderWidth: 1.5, borderColor: t.inputBorder, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, color: t.text },
    textarea:       { minHeight: 100, paddingTop: 14 },
    charCount:      { fontSize: 12, color: t.textTertiary, textAlign: 'right', marginTop: 4 },
    actions:        { paddingHorizontal: 28, paddingBottom: 24, gap: 10 },
    primaryButton:  { backgroundColor: t.primary, borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
    buttonDisabled: { opacity: 0.6 },
    primaryButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
    skipButton:     { alignItems: 'center', paddingVertical: 12 },
    skipText:       { fontSize: 14, color: t.textTertiary },
  });
}
