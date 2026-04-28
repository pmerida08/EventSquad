import { FlashList } from '@shopify/flash-list';
import { StatusBar } from 'expo-status-bar';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { GroupCard } from '@/components/GroupCard';
import { useTheme, type Theme } from '@/constants/theme';
import {
  fetchGroupsByEvent,
  getMyGroupForEvent,
  type GroupWithCount,
} from '@/lib/groups';

export default function EventGroupsScreen() {
  const t = useTheme();
  const s = makeStyles(t);
  const { eventId } = useLocalSearchParams<{ eventId: string }>();

  const [groups, setGroups]           = useState<GroupWithCount[]>([]);
  const [myGroupId, setMyGroupId]     = useState<string | null>(null);
  const [loading, setLoading]         = useState(true);
  const [refreshing, setRefreshing]   = useState(false);
  const [error, setError]             = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!eventId) return;
    try {
      const [g, mine] = await Promise.all([fetchGroupsByEvent(eventId), getMyGroupForEvent(eventId)]);
      setGroups(g);
      setMyGroupId(mine);
    } catch (e) {
      setError((e as Error).message);
    }
  }, [eventId]);

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  if (loading) {
    return (
      <SafeAreaView style={s.center} edges={['top', 'bottom']}>
        <StatusBar style={t.statusBar} />
        <ActivityIndicator size="large" color={t.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.container} edges={['top', 'bottom']}>
      <StatusBar style={t.statusBar} />

      <View style={s.header}>
        <Pressable onPress={() => router.back()} style={s.backBtn} hitSlop={8}>
          <Text style={s.backText}>←</Text>
        </Pressable>
        <Text style={s.title}>Grupos</Text>
        <View style={{ width: 36 }} />
      </View>

      {error ? (
        <View style={s.center}>
          <Text style={s.errorText}>{error}</Text>
        </View>
      ) : (
        <FlashList
          data={groups}
          estimatedItemSize={130}
          keyExtractor={(g) => g.id ?? ''}
          renderItem={({ item }) => (
            <GroupCard
              group={item}
              myGroupId={myGroupId}
              onPress={() => router.push(`/(app)/group/${item.id}/index` as never)}
            />
          )}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <View style={s.empty}>
              <Text style={s.emptyIcon}>👥</Text>
              <Text style={s.emptyTitle}>Sin grupos todavía</Text>
              <Text style={s.emptySub}>Sé el primero en crear uno para este evento.</Text>
            </View>
          }
          ListFooterComponent={<View style={{ height: 100 }} />}
          contentContainerStyle={{ paddingTop: 8 }}
        />
      )}

      {!myGroupId && (
        <Pressable
          style={s.fab}
          onPress={() => router.push(`/(app)/create-group?eventId=${eventId}` as never)}
        >
          <Text style={s.fabText}>+ Crear grupo</Text>
        </Pressable>
      )}
    </SafeAreaView>
  );
}

function makeStyles(t: Theme) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: t.background },
    center:    { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
    header:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, backgroundColor: t.surface, borderBottomWidth: 1, borderBottomColor: t.borderLight },
    backBtn:   { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
    backText:  { fontSize: 22, color: t.text },
    title:     { fontSize: 18, fontWeight: '700', color: t.text },
    empty:     { alignItems: 'center', paddingTop: 80, paddingHorizontal: 32 },
    emptyIcon: { fontSize: 52, marginBottom: 16 },
    emptyTitle:{ fontSize: 18, fontWeight: '700', color: t.text, marginBottom: 8 },
    emptySub:  { fontSize: 14, color: t.textTertiary, textAlign: 'center', lineHeight: 21 },
    errorText: { color: t.red, textAlign: 'center' },
    fab:       { position: 'absolute', bottom: 28, alignSelf: 'center', backgroundColor: t.primary, paddingHorizontal: 28, paddingVertical: 16, borderRadius: 30, shadowColor: t.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 10, elevation: 6 },
    fabText:   { color: '#fff', fontWeight: '700', fontSize: 15 },
  });
}
