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

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, [load]);

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
      <SafeAreaView style={styles.center} edges={['top', 'bottom']}>
        <ActivityIndicator size="large" color="#6366F1" />
      </SafeAreaView>
    );
  }

  if (error || !group) {
    return (
      <SafeAreaView style={styles.center} edges={['top', 'bottom']}>
        <Text style={styles.errorText}>{error ?? 'Grupo no encontrado'}</Text>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>← Volver</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const isMember  = members.some((m) => m.user_id === userId);
  const isOwner   = members.some((m) => m.user_id === userId && m.role === 'owner');
  const isMine    = myGroupId === id;
  const isFull    = members.length >= group.max_members;
  const inOther   = myGroupId !== null && myGroupId !== undefined && myGroupId !== id;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn2} hitSlop={8}>
          <Text style={styles.backText}>←</Text>
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={1}>{group.name}</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.body}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Info card */}
        <View style={styles.card}>
          {group.description ? (
            <Text style={styles.description}>{group.description}</Text>
          ) : (
            <Text style={styles.noDescription}>Sin descripción</Text>
          )}

          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{members.length}</Text>
              <Text style={styles.statLabel}>miembros</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={styles.statValue}>{group.max_members}</Text>
              <Text style={styles.statLabel}>máximo</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={[styles.statValue, isFull ? { color: '#EF4444' } : { color: '#10B981' }]}>
                {isFull ? 'Lleno' : 'Abierto'}
              </Text>
              <Text style={styles.statLabel}>estado</Text>
            </View>
          </View>

          {/* Barra de ocupación */}
          <View style={styles.barBg}>
            <View
              style={[
                styles.barFill,
                { width: `${Math.min(1, members.length / group.max_members) * 100}%` as any },
                isFull && styles.barFull,
              ]}
            />
          </View>
        </View>

        {/* Miembros */}
        <Text style={styles.sectionTitle}>Miembros</Text>
        <View style={styles.card}>
          {members.length > 0 ? (
            <>
              <MemberAvatars
                members={members.map((m) => m.profiles)}
                maxVisible={6}
                size={44}
              />
              <View style={styles.memberList}>
                {members.map((m) => (
                  <View key={m.user_id} style={styles.memberRow}>
                    <View style={styles.memberInfo}>
                      <Text style={styles.memberName}>{m.profiles.display_name}</Text>
                      {m.profiles.verified && (
                        <Text style={styles.verified}>✓ verificado</Text>
                      )}
                    </View>
                    <View style={[styles.roleBadge, m.role === 'owner' && styles.roleBadgeOwner]}>
                      <Text style={[styles.roleText, m.role === 'owner' && styles.roleTextOwner]}>
                        {m.role === 'owner' ? 'Creador' : 'Miembro'}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            </>
          ) : (
            <Text style={styles.noDescription}>Sin miembros todavía</Text>
          )}
        </View>

        {/* Acciones */}
        {isMember ? (
          <View style={styles.actionsSection}>
            {/* Chat y votación (Fase 4 y 5) */}
            <Pressable
              style={styles.actionBtn}
              onPress={() => router.push(`/(app)/group/${id}/chat` as never)}
            >
              <Text style={styles.actionBtnIcon}>💬</Text>
              <Text style={styles.actionBtnText}>Chat del grupo</Text>
              <Text style={styles.actionBtnArrow}>→</Text>
            </Pressable>

            <Pressable
              style={styles.actionBtn}
              onPress={() => router.push(`/(app)/group/${id}/voting` as never)}
            >
              <Text style={styles.actionBtnIcon}>📍</Text>
              <Text style={styles.actionBtnText}>Punto de encuentro</Text>
              <Text style={styles.actionBtnArrow}>→</Text>
            </Pressable>

            {/* Salir */}
            {!isOwner && (
              <Pressable
                style={[styles.leaveBtn, actionLoading && styles.btnDisabled]}
                onPress={handleLeave}
                disabled={actionLoading}
              >
                {actionLoading
                  ? <ActivityIndicator color="#EF4444" size="small" />
                  : <Text style={styles.leaveBtnText}>Salir del grupo</Text>
                }
              </Pressable>
            )}
          </View>
        ) : (
          <View style={styles.actionsSection}>
            {inOther ? (
              <View style={styles.infoBox}>
                <Text style={styles.infoBoxText}>
                  Ya perteneces a otro grupo en este evento. Sal primero para unirte a este.
                </Text>
              </View>
            ) : isFull ? (
              <View style={styles.infoBox}>
                <Text style={styles.infoBoxText}>Este grupo ya está completo.</Text>
              </View>
            ) : (
              <Pressable
                style={[styles.joinBtn, actionLoading && styles.btnDisabled]}
                onPress={handleJoin}
                disabled={actionLoading}
              >
                {actionLoading
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={styles.joinBtnText}>Unirse al grupo →</Text>
                }
              </Pressable>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  center:    { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
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
  backBtn2: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  backText: { fontSize: 22, color: '#111827' },
  headerTitle: { flex: 1, fontSize: 17, fontWeight: '700', color: '#111827', textAlign: 'center' },
  body: { padding: 16, gap: 0 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  description:   { fontSize: 15, color: '#374151', lineHeight: 22, marginBottom: 16 },
  noDescription: { fontSize: 14, color: '#9CA3AF', fontStyle: 'italic' },
  statsRow:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', marginBottom: 14 },
  stat:        { alignItems: 'center', flex: 1 },
  statValue:   { fontSize: 22, fontWeight: '800', color: '#111827' },
  statLabel:   { fontSize: 11, color: '#9CA3AF', marginTop: 2, fontWeight: '500' },
  statDivider: { width: 1, height: 32, backgroundColor: '#E5E7EB' },
  barBg:   { height: 5, backgroundColor: '#E5E7EB', borderRadius: 4, overflow: 'hidden' },
  barFill: { height: 5, backgroundColor: '#6366F1', borderRadius: 4 },
  barFull: { backgroundColor: '#EF4444' },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 8 },
  memberList:   { marginTop: 14, gap: 0 },
  memberRow:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10, borderTopWidth: 1, borderTopColor: '#F3F4F6' },
  memberInfo:   { flex: 1 },
  memberName:   { fontSize: 14, fontWeight: '600', color: '#111827' },
  verified:     { fontSize: 11, color: '#10B981', marginTop: 2, fontWeight: '500' },
  roleBadge:         { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 3, backgroundColor: '#F3F4F6' },
  roleBadgeOwner:    { backgroundColor: '#EEF2FF' },
  roleText:          { fontSize: 11, color: '#6B7280', fontWeight: '600' },
  roleTextOwner:     { color: '#6366F1' },
  actionsSection: { gap: 10, marginBottom: 32 },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  actionBtnIcon:  { fontSize: 22 },
  actionBtnText:  { flex: 1, fontSize: 15, fontWeight: '600', color: '#111827' },
  actionBtnArrow: { fontSize: 16, color: '#9CA3AF' },
  joinBtn: {
    backgroundColor: '#6366F1',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 4,
  },
  joinBtnText:  { color: '#fff', fontWeight: '700', fontSize: 16 },
  leaveBtn: {
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#EF4444',
    marginTop: 4,
  },
  leaveBtnText: { color: '#EF4444', fontWeight: '600', fontSize: 15 },
  btnDisabled:  { opacity: 0.6 },
  infoBox: {
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    padding: 14,
    marginTop: 4,
  },
  infoBoxText: { fontSize: 13, color: '#92400E', lineHeight: 19 },
  errorText: { color: '#EF4444', marginBottom: 16, textAlign: 'center' },
  backBtn: { paddingHorizontal: 20, paddingVertical: 10, backgroundColor: '#6366F1', borderRadius: 10 },
  backBtnText: { color: '#fff', fontWeight: '600' },
});
