import { StatusBar } from 'expo-status-bar';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MemberAvatars } from '@/components/MemberAvatars';
import { useTheme, type Theme } from '@/constants/theme';
import {
  fetchGroupById,
  fetchGroupMembers,
  getMyGroupForEvent,
  joinGroup,
  leaveGroup,
  parseGroupError,
  type GroupRow,
  type MemberWithProfile,
} from '@/lib/groups';
import { useAuthStore } from '@/stores/authStore';

export default function GroupDetailScreen() {
  const t = useTheme();
  const s = makeStyles(t);
  const { id } = useLocalSearchParams<{ id: string }>();
  const userId = useAuthStore((s) => s.session?.user.id);

  const [group, setGroup]       = useState<GroupRow | null>(null);
  const [members, setMembers]   = useState<MemberWithProfile[]>([]);
  const [myGroupId, setMyGroup] = useState<string | null | undefined>(undefined);
  const [loading, setLoading]   = useState(true);
  const [actionLoading, setAL]  = useState(false);
  const [refreshing, setRef]    = useState(false);
  const [error, setError]       = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    try {
      const [g, m] = await Promise.all([fetchGroupById(id), fetchGroupMembers(id)]);
      setGroup(g);
      setMembers(m);
      if (g) {
        const mine = await getMyGroupForEvent(g.event_id);
        setMyGroup(mine);
      }
    } catch (e) {
      setError((e as Error).message);
    }
  }, [id]);

  useEffect(() => { load().finally(() => setLoading(false)); }, [load]);

  const onRefresh = useCallback(async () => {
    setRef(true);
    await load();
    setRef(false);
  }, [load]);

  async function handleJoin() {
    if (!id) return;
    setAL(true);
    try {
      await joinGroup(id);
      await load();
    } catch (e) {
      Alert.alert('No se pudo unir', parseGroupError((e as Error).message));
    } finally {
      setAL(false);
    }
  }

  async function handleLeave() {
    if (!id || !group) return;
    Alert.alert(
      'Salir del grupo',
      '¿Seguro que quieres salir? No podrás volver a unirte si el grupo se llena.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Salir',
          style: 'destructive',
          onPress: async () => {
            setAL(true);
            try {
              await leaveGroup(id);
              router.back();
            } catch (e) {
              Alert.alert('Error', (e as Error).message);
            } finally {
              setAL(false);
            }
          },
        },
      ],
    );
  }

  if (loading) {
    return (
      <SafeAreaView style={s.center} edges={['top', 'bottom']}>
        <StatusBar style={t.statusBar} />
        <ActivityIndicator size="large" color={t.primary} />
      </SafeAreaView>
    );
  }

  if (error || !group) {
    return (
      <SafeAreaView style={s.center} edges={['top', 'bottom']}>
        <StatusBar style={t.statusBar} />
        <Text style={s.errorText}>{error ?? 'Grupo no encontrado'}</Text>
        <Pressable onPress={() => router.back()} style={s.backBtn}>
          <Text style={s.backBtnText}>← Volver</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const isMember = members.some((m) => m.user_id === userId);
  const isOwner  = members.some((m) => m.user_id === userId && m.role === 'owner');
  const isFull   = members.length >= group.max_members;
  const inOther  = myGroupId !== null && myGroupId !== undefined && myGroupId !== id;

  return (
    <SafeAreaView style={s.container} edges={['top', 'bottom']}>
      <StatusBar style={t.statusBar} />

      <View style={s.header}>
        <Pressable onPress={() => router.back()} style={s.backBtn2} hitSlop={8}>
          <Text style={s.backText}>←</Text>
        </Pressable>
        <Text style={s.headerTitle} numberOfLines={1}>{group.name}</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        contentContainerStyle={s.body}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Info */}
        <View style={s.card}>
          {group.description
            ? <Text style={s.description}>{group.description}</Text>
            : <Text style={s.noDescription}>Sin descripción</Text>
          }
          <View style={s.statsRow}>
            <View style={s.stat}>
              <Text style={s.statValue}>{members.length}</Text>
              <Text style={s.statLabel}>miembros</Text>
            </View>
            <View style={s.statDivider} />
            <View style={s.stat}>
              <Text style={s.statValue}>{group.max_members}</Text>
              <Text style={s.statLabel}>máximo</Text>
            </View>
            <View style={s.statDivider} />
            <View style={s.stat}>
              <Text style={[s.statValue, { color: isFull ? t.red : t.green }]}>
                {isFull ? 'Lleno' : 'Abierto'}
              </Text>
              <Text style={s.statLabel}>estado</Text>
            </View>
          </View>
          <View style={s.barBg}>
            <View style={[s.barFill, { width: `${Math.min(1, members.length / group.max_members) * 100}%` as any }, isFull && s.barFull]} />
          </View>
        </View>

        {/* Miembros */}
        <Text style={s.sectionTitle}>Miembros</Text>
        <View style={s.card}>
          {members.length > 0 ? (
            <>
              <MemberAvatars members={members.map((m) => m.profiles)} maxVisible={6} size={44} />
              <View style={s.memberList}>
                {members.map((m) => (
                  <View key={m.user_id} style={s.memberRow}>
                    <View style={s.memberInfo}>
                      <Text style={s.memberName}>{m.profiles.display_name}</Text>
                      {m.profiles.verified && <Text style={s.verified}>✓ verificado</Text>}
                    </View>
                    <View style={[s.roleBadge, m.role === 'owner' && s.roleBadgeOwner]}>
                      <Text style={[s.roleText, m.role === 'owner' && s.roleTextOwner]}>
                        {m.role === 'owner' ? 'Creador' : 'Miembro'}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            </>
          ) : (
            <Text style={s.noDescription}>Sin miembros todavía</Text>
          )}
        </View>

        {/* Acciones */}
        {isMember ? (
          <View style={s.actionsSection}>
            <Pressable style={s.actionBtn} onPress={() => router.push(`/(app)/group/${id}/chat` as never)}>
              <Text style={s.actionBtnIcon}>💬</Text>
              <Text style={s.actionBtnText}>Chat del grupo</Text>
              <Text style={s.actionBtnArrow}>→</Text>
            </Pressable>
            <Pressable style={s.actionBtn} onPress={() => router.push(`/(app)/group/${id}/voting` as never)}>
              <Text style={s.actionBtnIcon}>📍</Text>
              <Text style={s.actionBtnText}>Punto de encuentro</Text>
              <Text style={s.actionBtnArrow}>→</Text>
            </Pressable>
            {!isOwner && (
              <Pressable style={[s.leaveBtn, actionLoading && s.btnDisabled]} onPress={handleLeave} disabled={actionLoading}>
                {actionLoading
                  ? <ActivityIndicator color={t.red} size="small" />
                  : <Text style={s.leaveBtnText}>Salir del grupo</Text>
                }
              </Pressable>
            )}
          </View>
        ) : (
          <View style={s.actionsSection}>
            {inOther ? (
              <View style={s.infoBox}>
                <Text style={s.infoBoxText}>Ya perteneces a otro grupo en este evento. Sal primero para unirte a este.</Text>
              </View>
            ) : isFull ? (
              <View style={s.infoBox}>
                <Text style={s.infoBoxText}>Este grupo ya está completo.</Text>
              </View>
            ) : (
              <Pressable style={[s.joinBtn, actionLoading && s.btnDisabled]} onPress={handleJoin} disabled={actionLoading}>
                {actionLoading
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={s.joinBtnText}>Unirse al grupo →</Text>
                }
              </Pressable>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function makeStyles(t: Theme) {
  return StyleSheet.create({
    container:    { flex: 1, backgroundColor: t.background },
    center:       { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
    header:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, backgroundColor: t.surface, borderBottomWidth: 1, borderBottomColor: t.borderLight },
    backBtn2:     { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
    backText:     { fontSize: 22, color: t.text },
    headerTitle:  { flex: 1, fontSize: 17, fontWeight: '700', color: t.text, textAlign: 'center' },
    body:         { padding: 16, gap: 0 },
    card:         { backgroundColor: t.surface, borderRadius: 16, padding: 16, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 },
    description:  { fontSize: 15, color: t.text, lineHeight: 22, marginBottom: 16 },
    noDescription:{ fontSize: 14, color: t.textTertiary, fontStyle: 'italic' },
    statsRow:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', marginBottom: 14 },
    stat:         { alignItems: 'center', flex: 1 },
    statValue:    { fontSize: 22, fontWeight: '800', color: t.text },
    statLabel:    { fontSize: 11, color: t.textTertiary, marginTop: 2, fontWeight: '500' },
    statDivider:  { width: 1, height: 32, backgroundColor: t.border },
    barBg:        { height: 5, backgroundColor: t.border, borderRadius: 4, overflow: 'hidden' },
    barFill:      { height: 5, backgroundColor: t.primary, borderRadius: 4 },
    barFull:      { backgroundColor: t.red },
    sectionTitle: { fontSize: 16, fontWeight: '700', color: t.text, marginBottom: 8 },
    memberList:   { marginTop: 14, gap: 0 },
    memberRow:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10, borderTopWidth: 1, borderTopColor: t.borderLight },
    memberInfo:   { flex: 1 },
    memberName:   { fontSize: 14, fontWeight: '600', color: t.text },
    verified:     { fontSize: 11, color: t.green, marginTop: 2, fontWeight: '500' },
    roleBadge:      { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 3, backgroundColor: t.surface2 },
    roleBadgeOwner: { backgroundColor: t.primaryBg },
    roleText:       { fontSize: 11, color: t.textSecondary, fontWeight: '600' },
    roleTextOwner:  { color: t.primary },
    actionsSection: { gap: 10, marginBottom: 32 },
    actionBtn:    { flexDirection: 'row', alignItems: 'center', backgroundColor: t.surface, borderRadius: 14, padding: 16, gap: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 },
    actionBtnIcon: { fontSize: 22 },
    actionBtnText: { flex: 1, fontSize: 15, fontWeight: '600', color: t.text },
    actionBtnArrow:{ fontSize: 16, color: t.textTertiary },
    joinBtn:      { backgroundColor: t.primary, borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 4 },
    joinBtnText:  { color: '#fff', fontWeight: '700', fontSize: 16 },
    leaveBtn:     { borderRadius: 14, paddingVertical: 14, alignItems: 'center', borderWidth: 1.5, borderColor: t.red, marginTop: 4 },
    leaveBtnText: { color: t.red, fontWeight: '600', fontSize: 15 },
    btnDisabled:  { opacity: 0.6 },
    infoBox:      { backgroundColor: t.amberBg, borderRadius: 12, padding: 14, marginTop: 4 },
    infoBoxText:  { fontSize: 13, color: '#92400E', lineHeight: 19 },
    errorText:    { color: t.red, marginBottom: 16, textAlign: 'center' },
    backBtn:      { paddingHorizontal: 20, paddingVertical: 10, backgroundColor: t.primary, borderRadius: 10 },
    backBtnText:  { color: '#fff', fontWeight: '600' },
  });
}
