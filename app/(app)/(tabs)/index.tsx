import { FlashList } from '@shopify/flash-list';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EventCard } from '@/components/EventCard';
import { useTheme, type Theme } from '@/constants/theme';
import {
  fetchEventsNear,
  fetchAllEvents,
  EVENT_CATEGORIES,
  type EventNear,
  type EventRow,
} from '@/lib/events';
import { useLocationStore } from '@/stores/locationStore';

const ALL_CAT = 'Todos';

export default function EventsScreen() {
  const t = useTheme();
  const s = makeStyles(t);

  const coordinates = useLocationStore((s) => s.coordinates);
  const permGranted = useLocationStore((s) => s.permissionGranted);

  const [events, setEvents]             = useState<(EventNear | EventRow)[]>([]);
  const [loading, setLoading]           = useState(true);
  const [refreshing, setRefreshing]     = useState(false);
  const [selectedCat, setSelectedCat]   = useState<string>(ALL_CAT);
  const [error, setError]               = useState<string | null>(null);

  const loadEvents = useCallback(async (cat: string) => {
    try {
      setError(null);
      const category = cat === ALL_CAT ? undefined : cat;
      const data = coordinates
        ? await fetchEventsNear(coordinates.latitude, coordinates.longitude, 500, category)
        : await fetchAllEvents(category);
      setEvents(data);
    } catch (e) {
      setError((e as Error).message);
    }
  }, [coordinates]);

  useEffect(() => {
    setLoading(true);
    loadEvents(selectedCat).finally(() => setLoading(false));
  }, [loadEvents, selectedCat]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadEvents(selectedCat);
    setRefreshing(false);
  }, [loadEvents, selectedCat]);

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      <StatusBar style={t.statusBar} />

      {/* Header */}
      <View style={s.header}>
        <Text style={s.headerTitle}>Eventos cerca de ti</Text>
        {coordinates ? (
          <Text style={s.headerSub}>📍 Ubicación activa</Text>
        ) : permGranted === false ? (
          <Text style={s.headerSub}>📍 Activa ubicación para ver distancias</Text>
        ) : (
          <Text style={s.headerSub}>📍 Buscando ubicación…</Text>
        )}
      </View>

      {/* Filtros */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.filtersRow}
        style={s.filtersScroll}
      >
        {[ALL_CAT, ...EVENT_CATEGORIES].map((cat) => (
          <Pressable
            key={cat}
            style={[s.chip, selectedCat === cat && s.chipActive]}
            onPress={() => setSelectedCat(cat)}
          >
            <Text style={[s.chipText, selectedCat === cat && s.chipTextActive]}>
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {loading ? (
        <View style={s.center}>
          <ActivityIndicator size="large" color={t.primary} />
          <Text style={s.loadingText}>Cargando eventos…</Text>
        </View>
      ) : error ? (
        <View style={s.center}>
          <Text style={s.errorEmoji}>⚠️</Text>
          <Text style={s.errorText}>{error}</Text>
          <Pressable style={s.retryBtn} onPress={() => loadEvents(selectedCat)}>
            <Text style={s.retryText}>Reintentar</Text>
          </Pressable>
        </View>
      ) : events.length === 0 ? (
        <View style={s.center}>
          <Text style={s.emptyEmoji}>🔍</Text>
          <Text style={s.emptyTitle}>Sin eventos</Text>
          <Text style={s.emptySubtitle}>No hay eventos de esta categoría cerca de ti.</Text>
        </View>
      ) : (
        <FlashList
          data={events}
          estimatedItemSize={260}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <EventCard event={item} onPress={() => router.push(`/(app)/event/${item.id}`)} />
          )}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={t.primary} />}
          contentContainerStyle={s.list}
        />
      )}
    </SafeAreaView>
  );
}

function makeStyles(t: Theme) {
  return StyleSheet.create({
    container:    { flex: 1, backgroundColor: t.background },
    header:       { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8 },
    headerTitle:  { fontSize: 24, fontWeight: '800', color: t.text },
    headerSub:    { fontSize: 13, color: t.textSecondary, marginTop: 2 },
    filtersScroll:{ maxHeight: 52 },
    filtersRow:   { paddingHorizontal: 16, paddingVertical: 10, gap: 8 },
    chip:         { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20, backgroundColor: t.surface, borderWidth: 1.5, borderColor: t.border },
    chipActive:   { backgroundColor: t.primary, borderColor: t.primary },
    chipText:     { fontSize: 13, fontWeight: '600', color: t.textSecondary },
    chipTextActive:{ color: '#fff' },
    list:         { paddingVertical: 8, paddingBottom: 24 },
    center:       { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
    loadingText:  { marginTop: 12, color: t.textSecondary, fontSize: 15 },
    errorEmoji:   { fontSize: 48, marginBottom: 12 },
    errorText:    { color: t.red, textAlign: 'center', marginBottom: 16 },
    retryBtn:     { backgroundColor: t.primary, borderRadius: 10, paddingHorizontal: 24, paddingVertical: 10 },
    retryText:    { color: '#fff', fontWeight: '600' },
    emptyEmoji:   { fontSize: 48, marginBottom: 12 },
    emptyTitle:   { fontSize: 18, fontWeight: '700', color: t.text, marginBottom: 8 },
    emptySubtitle:{ fontSize: 14, color: t.textSecondary, textAlign: 'center' },
  });
}
