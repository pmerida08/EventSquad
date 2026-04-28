import { FlashList } from '@shopify/flash-list';
import { Image } from 'expo-image';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { fetchMyGroups, type GroupWithCount } from '@/lib/groups';
import { formatEventDate } from '@/lib/events';

type MyGroup = GroupWithCount & {
  events: { name: string; date: string; image_url: string | null } | null;
};

export default function GroupsScreen() {
  const [groups, setGroups]       = useState<MyGroup[]>([]);
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError]         = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await fetchMyGroups();
      setGroups(data as MyGroup[]);
    } catch (e) {
      setError((e as Error).message);
    }
  }, []);

  // Recarga al volver al tab
  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      load().finally(() => setLoading(false));
    }, [load]),
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mis grupos</Text>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#6366F1" />
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : (
        <FlashList
          data={groups}
          estimatedItemSize={140}
          keyExtractor={(g) => g.id ?? ''}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          renderItem={({ item }) => <MyGroupCard group={item} />}
          ListEmptyComponent={<EmptyState />}
          ListFooterComponent={<View style={{ height: 24 }} />}
          contentContainerStyle={{ paddingTop: 8 }}
        />
      )}
    </SafeAreaView>
  );
}

function MyGroupCard({ group }: { group: MyGroup }) {
  const count = group.member_count ?? 0;
  const max   = group.max_members ?? 10;
  const pct   = Math.min(1, count / max);

  return (
    <Pressable
      style={styles.card}
      onPress={() => router.push(`/(app)/group/${group.id}/index` as never)}
      android_ripple={{ color: '#E0E7FF' }}
    >
      {/* Imagen del evento */}
      {group.events?.image_url ? (
        <Image
          source={{ uri: group.events.image_url }}
          style={styles.cardImage}
          contentFit="cover"
        />
      ) : (
        <View style={styles.cardImagePlaceholder}>
          <Text style={styles.cardImageEmoji}>🎵</Text>
        </View>
      )}

      <View style={styles.cardBody}>
        {/* Evento */}
        {group.events && (
          <Text style={styles.eventName} numberOfLines={1}>{group.events.name}</Text>
        )}
        {group.events && (
          <Text style={styles.eventDate}>{formatEventDate(group.events.date)}</Text>
        )}

        {/* Grupo */}
        <Text style={styles.groupName} numberOfLines={1}>{group.name}</Text>

        {/* Miembros + barra */}
        <View style={styles.membersRow}>
          <Text style={styles.membersText}>{count} / {max} miembros</Text>
        </View>
        <View style={styles.barBg}>
          <View style={[styles.barFill, { width: `${pct * 100}%` as any }]} />
        </View>
      </View>
    </Pressable>
  );
}

function EmptyState() {
  return (
    <View style={styles.empty}>
      <Text style={styles.emptyIcon}>🎶</Text>
      <Text style={styles.emptyTitle}>Aún no estás en ningún grupo</Text>
      <Text style={styles.emptySub}>
        Explora los eventos y únete o crea un grupo para ir acompañado.
      </Text>
      <Pressable
        style={styles.emptyBtn}
        onPress={() => router.push('/(app)/(tabs)/' as never)}
      >
        <Text style={styles.emptyBtnText}>Explorar eventos →</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  center:    { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#111827' },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginHorizontal: 16,
    marginVertical: 6,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 2,
    flexDirection: 'row',
  },
  cardImage: { width: 90, height: '100%' as any },
  cardImagePlaceholder: {
    width: 90,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardImageEmoji: { fontSize: 28 },
  cardBody: {
    flex: 1,
    padding: 14,
    gap: 2,
  },
  eventName:  { fontSize: 11, color: '#6366F1', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  eventDate:  { fontSize: 12, color: '#9CA3AF', marginBottom: 4 },
  groupName:  { fontSize: 15, fontWeight: '700', color: '#111827', marginBottom: 6 },
  membersRow: { flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 4 },
  membersText: { fontSize: 11, color: '#9CA3AF' },
  barBg:   { height: 4, backgroundColor: '#E5E7EB', borderRadius: 4, overflow: 'hidden' },
  barFill: { height: 4, backgroundColor: '#6366F1', borderRadius: 4 },
  empty: {
    alignItems: 'center',
    paddingTop: 80,
    paddingHorizontal: 32,
  },
  emptyIcon:  { fontSize: 52, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 8, textAlign: 'center' },
  emptySub:   { fontSize: 14, color: '#9CA3AF', textAlign: 'center', lineHeight: 21, marginBottom: 24 },
  emptyBtn: {
    backgroundColor: '#6366F1',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
  },
  emptyBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  errorText: { color: '#EF4444', textAlign: 'center' },
});
