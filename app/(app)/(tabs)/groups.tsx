import { FlashList } from '@shopify/flash-list';
import { Image } from 'expo-image';
import { StatusBar } from 'expo-status-bar';
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

import { useTheme, type Theme } from '@/constants/theme';
import { fetchMyGroups, type GroupWithCount } from '@/lib/groups';
import { formatEventDate } from '@/lib/events';

type MyGroup = GroupWithCount & {
  events: { name: string; date: string; image_url: string | null } | null;
};

export default function GroupsScreen() {
  const t = useTheme();
  const s = makeStyles(t);

  const [groups, setGroups]         = useState<MyGroup[]>([]);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError]           = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await fetchMyGroups();
      setGroups(data as MyGroup[]);
    } catch (e) {
      setError((e as Error).message);
    }
  }, []);

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
    <SafeAreaView style={s.container} edges={['top']}>
      <StatusBar style={t.statusBar} />

      <View style={s.header}>
        <Text style={s.headerTitle}>Mis grupos</Text>
      </View>

      {loading ? (
        <View style={s.center}>
          <ActivityIndicator size="large" color={t.primary} />
        </View>
      ) : error ? (
        <View style={s.center}>
          <Text style={s.errorText}>{error}</Text>
        </View>
      ) : (
        <FlashList
          data={groups}
          estimatedItemSize={140}
          keyExtractor={(g) => g.id ?? ''}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          renderItem={({ item }) => <MyGroupCard group={item} theme={t} styles={s} />}
          ListEmptyComponent={<EmptyState theme={t} styles={s} />}
          ListFooterComponent={<View style={{ height: 24 }} />}
          contentContainerStyle={{ paddingTop: 8 }}
        />
      )}
    </SafeAreaView>
  );
}

function MyGroupCard({ group, theme: t, styles: s }: { group: MyGroup; theme: Theme; styles: ReturnType<typeof makeStyles> }) {
  const count = group.member_count ?? 0;
  const max   = group.max_members ?? 10;
  const pct   = Math.min(1, count / max);

  return (
    <Pressable
      style={s.card}
      onPress={() => router.push(`/(app)/group/${group.id}/index` as never)}
      android_ripple={{ color: t.primaryBg }}
    >
      {group.events?.image_url ? (
        <Image source={{ uri: group.events.image_url }} style={s.cardImage} contentFit="cover" />
      ) : (
        <View style={s.cardImagePlaceholder}>
          <Text style={s.cardImageEmoji}>🎵</Text>
        </View>
      )}
      <View style={s.cardBody}>
        {group.events && <Text style={s.eventName} numberOfLines={1}>{group.events.name}</Text>}
        {group.events && <Text style={s.eventDate}>{formatEventDate(group.events.date)}</Text>}
        <Text style={s.groupName} numberOfLines={1}>{group.name}</Text>
        <View style={s.membersRow}>
          <Text style={s.membersText}>{count} / {max} miembros</Text>
        </View>
        <View style={s.barBg}>
          <View style={[s.barFill, { width: `${pct * 100}%` as any }]} />
        </View>
      </View>
    </Pressable>
  );
}

function EmptyState({ theme: t, styles: s }: { theme: Theme; styles: ReturnType<typeof makeStyles> }) {
  return (
    <View style={s.empty}>
      <Text style={s.emptyIcon}>🎶</Text>
      <Text style={s.emptyTitle}>Aún no estás en ningún grupo</Text>
      <Text style={s.emptySub}>Explora los eventos y únete o crea un grupo para ir acompañado.</Text>
      <Pressable style={s.emptyBtn} onPress={() => router.push('/(app)/(tabs)/' as never)}>
        <Text style={s.emptyBtnText}>Explorar eventos →</Text>
      </Pressable>
    </View>
  );
}

function makeStyles(t: Theme) {
  return StyleSheet.create({
    container:   { flex: 1, backgroundColor: t.background },
    center:      { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
    header:      { paddingHorizontal: 20, paddingVertical: 16, backgroundColor: t.surface, borderBottomWidth: 1, borderBottomColor: t.borderLight },
    headerTitle: { fontSize: 22, fontWeight: '800', color: t.text },
    card:        { backgroundColor: t.surface, borderRadius: 16, marginHorizontal: 16, marginVertical: 6, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 8, elevation: 2, flexDirection: 'row' },
    cardImage:   { width: 90, height: '100%' as any },
    cardImagePlaceholder: { width: 90, backgroundColor: t.primaryBg, alignItems: 'center', justifyContent: 'center' },
    cardImageEmoji: { fontSize: 28 },
    cardBody:    { flex: 1, padding: 14, gap: 2 },
    eventName:   { fontSize: 11, color: t.primary, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
    eventDate:   { fontSize: 12, color: t.textTertiary, marginBottom: 4 },
    groupName:   { fontSize: 15, fontWeight: '700', color: t.text, marginBottom: 6 },
    membersRow:  { flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 4 },
    membersText: { fontSize: 11, color: t.textTertiary },
    barBg:       { height: 4, backgroundColor: t.border, borderRadius: 4, overflow: 'hidden' },
    barFill:     { height: 4, backgroundColor: t.primary, borderRadius: 4 },
    empty:       { alignItems: 'center', paddingTop: 80, paddingHorizontal: 32 },
    emptyIcon:   { fontSize: 52, marginBottom: 16 },
    emptyTitle:  { fontSize: 18, fontWeight: '700', color: t.text, marginBottom: 8, textAlign: 'center' },
    emptySub:    { fontSize: 14, color: t.textTertiary, textAlign: 'center', lineHeight: 21, marginBottom: 24 },
    emptyBtn:    { backgroundColor: t.primary, paddingHorizontal: 24, paddingVertical: 14, borderRadius: 12 },
    emptyBtnText:{ color: '#fff', fontWeight: '700', fontSize: 15 },
    errorText:   { color: t.red, textAlign: 'center' },
  });
}
