import { FlashList } from '@shopify/flash-list';
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
  const coordinates    = useLocationStore((s) => s.coordinates);
  const permGranted    = useLocationStore((s) => s.permissionGranted);

  const [events, setEvents]       = useState<(EventNear | EventRow)[]>([]);
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCat, setSelectedCat] = useState<string>(ALL_CAT);
  const [error, setError]         = useState<string | null>(null);

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

  // Carga inicial y cuando cambian coordenadas o categoría
  useEffect(() => {
    setLoading(true);
    loadEvents(selectedCat).finally(() => setLoading(false));
  }, [loadEvents, selectedCat]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadEvents(selectedCat);
    setRefreshing(false);
  }, [loadEvents, selectedCat]);

  const categories = [ALL_CAT, ...EVENT_CATEGORIES];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Eventos cerca de ti</Text>
        {coordinates ? (
          <Text style={styles.headerSub}>📍 Ubicación activa</Text>
        ) : permGranted === false ? (
          <Text style={styles.headerSub}>📍 Activa ubicación para ver distancias</Text>
        ) : (
          <Text style={styles.headerSub}>📍 Buscando ubicación…</Text>
        )}
      </View>

      {/* Filtros de categoría */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filtersRow}
        style={styles.filtersScroll}
      >
        {categories.map((cat) => (
          <Pressable
            key={cat}
            style={[styles.chip, selectedCat === cat && styles.chipActive]}
            onPress={() => setSelectedCat(cat)}
          >
            <Text style={[styles.chipText, selectedCat === cat && styles.chipTextActive]}>
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Contenido */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#6366F1" />
          <Text style={styles.loadingText}>Cargando eventos…</Text>
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.errorEmoji}>⚠️</Text>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable style={styles.retryBtn} onPress={() => loadEvents(selectedCat)}>
            <Text style={styles.retryText}>Reintentar</Text>
          </Pressable>
        </View>
      ) : events.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyEmoji}>🔍</Text>
          <Text style={styles.emptyTitle}>Sin eventos</Text>
          <Text style={styles.emptySubtitle}>
            No hay eventos de esta categoría cerca de ti.
          </Text>
        </View>
      ) : (
        <FlashList
          data={events}
          estimatedItemSize={260}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <EventCard
              event={item}
              onPress={() => router.push(`/(app)/event/${item.id}`)}
            />
          )}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6366F1" />
          }
          contentContainerStyle={styles.list}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: '#F9FAFB' },
  header:       { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8 },
  headerTitle:  { fontSize: 24, fontWeight: '800', color: '#111827' },
  headerSub:    { fontSize: 13, color: '#6B7280', marginTop: 2 },
  filtersScroll:{ maxHeight: 52 },
  filtersRow:   { paddingHorizontal: 16, paddingVertical: 10, gap: 8 },
  chip: {
    paddingHorizontal: 16, paddingVertical: 6,
    borderRadius: 20, backgroundColor: '#fff',
    borderWidth: 1.5, borderColor: '#E5E7EB',
  },
  chipActive:     { backgroundColor: '#6366F1', borderColor: '#6366F1' },
  chipText:       { fontSize: 13, fontWeight: '600', color: '#374151' },
  chipTextActive: { color: '#fff' },
  list:       { paddingVertical: 8, paddingBottom: 24 },
  center:     { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  loadingText:  { marginTop: 12, color: '#6B7280', fontSize: 15 },
  errorEmoji:   { fontSize: 48, marginBottom: 12 },
  errorText:    { color: '#EF4444', textAlign: 'center', marginBottom: 16 },
  retryBtn:     { backgroundColor: '#6366F1', borderRadius: 10, paddingHorizontal: 24, paddingVertical: 10 },
  retryText:    { color: '#fff', fontWeight: '600' },
  emptyEmoji:   { fontSize: 48, marginBottom: 12 },
  emptyTitle:   { fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 8 },
  emptySubtitle:{ fontSize: 14, color: '#6B7280', textAlign: 'center' },
});
