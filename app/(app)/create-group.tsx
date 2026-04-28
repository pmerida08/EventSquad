import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { createGroup, parseGroupError } from '@/lib/groups';

const MAX_MEMBERS_OPTIONS = [2, 3, 4, 5, 6, 8, 10, 15, 20];

export default function CreateGroupScreen() {
  const { eventId } = useLocalSearchParams<{ eventId: string }>();

  const [name, setName]           = useState('');
  const [description, setDesc]    = useState('');
  const [maxMembers, setMax]      = useState(5);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState<string | null>(null);

  async function handleCreate() {
    if (!name.trim()) { setError('El nombre es obligatorio.'); return; }
    if (!eventId)     { setError('Evento no identificado.'); return; }
    setError(null);
    setLoading(true);
    try {
      const group = await createGroup(eventId, name.trim(), description.trim(), maxMembers);
      // Ir directamente al detalle del grupo recién creado
      router.replace(`/(app)/group/${group.id}/index` as never);
    } catch (e) {
      setError(parseGroupError((e as Error).message));
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
            <Text style={styles.backText}>←</Text>
          </Pressable>
          <Text style={styles.title}>Crear grupo</Text>
          <View style={{ width: 36 }} />
        </View>

        <ScrollView
          contentContainerStyle={styles.body}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Nombre */}
          <Text style={styles.label}>Nombre del grupo *</Text>
          <TextInput
            style={styles.input}
            placeholder="Ej: Quedada sección A, fila 10"
            placeholderTextColor="#9CA3AF"
            value={name}
            onChangeText={setName}
            maxLength={60}
            returnKeyType="next"
          />
          <Text style={styles.charCount}>{name.length}/60</Text>

          {/* Descripción */}
          <Text style={styles.label}>Descripción (opcional)</Text>
          <TextInput
            style={[styles.input, styles.inputMultiline]}
            placeholder="Cuenta algo sobre el grupo: zona, planes antes/después del evento…"
            placeholderTextColor="#9CA3AF"
            value={description}
            onChangeText={setDesc}
            maxLength={200}
            multiline
            textAlignVertical="top"
          />
          <Text style={styles.charCount}>{description.length}/200</Text>

          {/* Máximo de miembros */}
          <Text style={styles.label}>Máximo de miembros</Text>
          <View style={styles.optionsRow}>
            {MAX_MEMBERS_OPTIONS.map((n) => (
              <Pressable
                key={n}
                style={[styles.optionChip, maxMembers === n && styles.optionChipActive]}
                onPress={() => setMax(n)}
              >
                <Text style={[styles.optionText, maxMembers === n && styles.optionTextActive]}>
                  {n}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Error */}
          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          {/* Botón */}
          <Pressable
            style={[styles.createBtn, (!name.trim() || loading) && styles.createBtnDisabled]}
            onPress={handleCreate}
            disabled={!name.trim() || loading}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.createBtnText}>Crear grupo →</Text>
            }
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  backBtn:  { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  backText: { fontSize: 22, color: '#111827' },
  title:    { fontSize: 18, fontWeight: '700', color: '#111827' },
  body:     { padding: 20, gap: 4 },
  label:    { fontSize: 14, fontWeight: '600', color: '#374151', marginTop: 16, marginBottom: 6 },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#111827',
  },
  inputMultiline: { minHeight: 90, paddingTop: 12 },
  charCount: { fontSize: 11, color: '#9CA3AF', textAlign: 'right', marginTop: 4 },
  optionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
  },
  optionChipActive: { backgroundColor: '#6366F1', borderColor: '#6366F1' },
  optionText:       { fontSize: 14, fontWeight: '600', color: '#6B7280' },
  optionTextActive: { color: '#fff' },
  errorText: {
    color: '#EF4444',
    fontSize: 13,
    marginTop: 12,
    backgroundColor: '#FEF2F2',
    padding: 12,
    borderRadius: 10,
  },
  createBtn: {
    marginTop: 24,
    backgroundColor: '#6366F1',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  createBtnDisabled: { backgroundColor: '#A5B4FC' },
  createBtnText:     { color: '#fff', fontWeight: '700', fontSize: 16 },
});
