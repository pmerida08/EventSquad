import { FlashList } from '@shopify/flash-list';
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
import {
  fetchGroupsByEvent,
  getMyGroupForEvent,
  type GroupWithCount,
} from '@/lib/groups';

export default function EventGroupsScreen() {
  const { eventId } = useLocalSearchParams<{ eventId: string }>();

  const [groups, setGroups]       = useState<GroupWithCount[]>([]);
  const [myGroupId, setMyGroupId] = useState<string | null>(null);
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError]         = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!eventId) return;
    try {
      const [g, mine] = await Promise.all([
        fetchGroupsByEvent(eventId),
        getMyGroupForEvent(eventId),
      ]);
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
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color="#6366F1" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
          <Text style={styles.backText}>←</Text>
        </Pressable>
        <Text style={styles.title}>Grupos</Text>
        <View style={{ width: 36 }} />
      </View>

      {error ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>{error}</Text>
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
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>👥</Text>
              <Text style={styles.emptyTitle}>Sin grupos todavía</Text>
              <Text style={styles.emptySub}>Sé el primero en crear uno para este evento.</Text>
            </View>
          }
          ListFooterComponent={<View style={{ height: 100 }} />}
          contentContainerStyle={{ paddingTop: 8 }}
        />
      )}

      {/* FAB — crear grupo (solo si el usuario no tiene ya uno) */}
      {!myGroupId && (
        <Pressable
          style={styles.fab}
          onPress={() => router.push(`/(app)/create-group?eventId=${eventId}` as never)}
        >
          <Text style={styles.fabText}>+ Crear grupo</Text>
        </Pressable>
      )}
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
  backBtn:  { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  backText: { fontSize: 22, color: '#111827' },
  title:    { fontSize: 18, fontWeight: '700', color: '#111827' },
  empty: {
    alignItems: 'center',
    paddingTop: 80,
    paddingHorizontal: 32,
  },
  emptyIcon:  { fontSize: 52, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 8 },
  emptySub:   { fontSize: 14, color: '#9CA3AF', textAlign: 'center', lineHeight: 21 },
  errorText:  { color: '#EF4444', textAlign: 'center' },
  fab: {
    position: 'absolute',
    bottom: 28,
    alignSelf: 'center',
    backgroundColor: '#6366F1',
    paddingHorizontal: 28,
    paddingVertical: 16,
    borderRadius: 30,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  fabText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
