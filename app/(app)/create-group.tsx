import { StatusBar } from 'expo-status-bar';
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

import { useTheme, type Theme } from '@/constants/theme';
import { createGroup, parseGroupError } from '@/lib/groups';

const MAX_MEMBERS_OPTIONS = [2, 3, 4, 5, 6, 8, 10, 15, 20];

export default function CreateGroupScreen() {
  const t = useTheme();
  const s = makeStyles(t);
  const { eventId } = useLocalSearchParams<{ eventId: string }>();

  const [name, setName]       = useState('');
  const [description, setDesc]= useState('');
  const [maxMembers, setMax]  = useState(5);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  async function handleCreate() {
    if (!name.trim()) { setError('El nombre es obligatorio.'); return; }
    if (!eventId)     { setError('Evento no identificado.'); return; }
    setError(null);
    setLoading(true);
    try {
      const group = await createGroup(eventId, name.trim(), description.trim(), maxMembers);
      router.replace(`/(app)/group/${group.id}` as never);
    } catch (e) {
      setError(parseGroupError((e as Error).message));
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={s.container} edges={['top', 'bottom']}>
      <StatusBar style={t.statusBar} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={s.header}>
          <Pressable onPress={() => router.back()} style={s.backBtn} hitSlop={8}>
            <Text style={s.backText}>←</Text>
          </Pressable>
          <Text style={s.title}>Crear grupo</Text>
          <View style={{ width: 36 }} />
        </View>

        <ScrollView contentContainerStyle={s.body} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <Text style={s.label}>Nombre del grupo *</Text>
          <TextInput
            style={s.input}
            placeholder="Ej: Quedada sección A, fila 10"
            placeholderTextColor={t.textTertiary}
            value={name}
            onChangeText={setName}
            maxLength={60}
            returnKeyType="next"
          />
          <Text style={s.charCount}>{name.length}/60</Text>

          <Text style={s.label}>Descripción (opcional)</Text>
          <TextInput
            style={[s.input, s.inputMultiline]}
            placeholder="Cuenta algo sobre el grupo: zona, planes antes/después del evento…"
            placeholderTextColor={t.textTertiary}
            value={description}
            onChangeText={setDesc}
            maxLength={200}
            multiline
            textAlignVertical="top"
          />
          <Text style={s.charCount}>{description.length}/200</Text>

          <Text style={s.label}>Máximo de miembros</Text>
          <View style={s.optionsRow}>
            {MAX_MEMBERS_OPTIONS.map((n) => (
              <Pressable
                key={n}
                style={[s.optionChip, maxMembers === n && s.optionChipActive]}
                onPress={() => setMax(n)}
              >
                <Text style={[s.optionText, maxMembers === n && s.optionTextActive]}>{n}</Text>
              </Pressable>
            ))}
          </View>

          {error ? <Text style={s.errorText}>{error}</Text> : null}

          <Pressable
            style={[s.createBtn, (!name.trim() || loading) && s.createBtnDisabled]}
            onPress={handleCreate}
            disabled={!name.trim() || loading}
          >
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.createBtnText}>Crear grupo →</Text>}
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function makeStyles(t: Theme) {
  return StyleSheet.create({
    container:        { flex: 1, backgroundColor: t.background },
    header:           { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, backgroundColor: t.surface, borderBottomWidth: 1, borderBottomColor: t.borderLight },
    backBtn:          { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
    backText:         { fontSize: 22, color: t.text },
    title:            { fontSize: 18, fontWeight: '700', color: t.text },
    body:             { padding: 20, gap: 4 },
    label:            { fontSize: 14, fontWeight: '600', color: t.textSecondary, marginTop: 16, marginBottom: 6 },
    input:            { backgroundColor: t.inputBg, borderWidth: 1.5, borderColor: t.inputBorder, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: t.text },
    inputMultiline:   { minHeight: 90, paddingTop: 12 },
    charCount:        { fontSize: 11, color: t.textTertiary, textAlign: 'right', marginTop: 4 },
    optionsRow:       { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    optionChip:       { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, backgroundColor: t.surface, borderWidth: 1.5, borderColor: t.border },
    optionChipActive: { backgroundColor: t.primary, borderColor: t.primary },
    optionText:       { fontSize: 14, fontWeight: '600', color: t.textSecondary },
    optionTextActive: { color: '#fff' },
    errorText:        { color: t.red, fontSize: 13, marginTop: 12, backgroundColor: t.redBg, padding: 12, borderRadius: 10 },
    createBtn:        { marginTop: 24, backgroundColor: t.primary, borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
    createBtnDisabled:{ backgroundColor: '#A5B4FC' },
    createBtnText:    { color: '#fff', fontWeight: '700', fontSize: 16 },
  });
}
