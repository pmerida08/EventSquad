import FontAwesome from '@expo/vector-icons/FontAwesome';
import { FlashList } from '@shopify/flash-list';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  RefreshControl,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EventCard } from '@/components/EventCard';
import { EventCardSkeleton } from '@/components/EventCardSkeleton';
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

  const coordinates = useLocationStore((st) => st.coordinates);
  const permGranted = useLocationStore((st) => st.permissionGranted);

  const [events, setEvents]           = useState<(EventNear | EventRow)[]>([]);
  const [loading, setLoading]         = useState(true);
  const [refreshing, setRefreshing]   = useState(false);
  const [selectedCat, setSelectedCat] = useState<string>(ALL_CAT);
  const [error, setError]             = useState<string | null>(null);
  const [query, setQuery]             = useState('');
  const [searchFocused, setSearchFocused] = useState(false);

  const inputRef    = useRef<TextInput>(null);
  // Ref para leer las coordenadas dentro de loadEvents sin que el callback
  // se recree cada vez que cambia la ubicación (evita re-fetches automáticos
  // durante la sesión — el usuario puede usar pull-to-refresh para añadir distancias).
  const coordsRef   = useRef(coordinates);
  useEffect(() => { coordsRef.current = coordinates }, [coordinates]);

  const loadEvents = useCallback(async (cat: string) => {
    try {
      setError(null);
      const coords   = coordsRef.current;
      const category = cat === ALL_CAT ? undefined : cat;
      const data = coords
        ? await fetchEventsNear(coords.latitude, coords.longitude, 500, category)
        : await fetchAllEvents(category);
      setEvents(data);
    } catch (e) {
      setError((e as Error).message);
    }
  }, []); // Sin dependencias: coordsRef.current se lee en el momento de ejecución

  useEffect(() => {
    setLoading(true);
    loadEvents(selectedCat).finally(() => setLoading(false));
  }, [loadEvents, selectedCat]); // Solo recarga si cambia categoría

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadEvents(selectedCat);
    setRefreshing(false);
  }, [loadEvents, selectedCat]);

  // Filtrado client-side por query (nombre, recinto, dirección)
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return events;
    return events.filter((e) =>
      e.name.toLowerCase().includes(q) ||
      e.venue.toLowerCase().includes(q) ||
      e.address.toLowerCase().includes(q),
    );
  }, [events, query]);

  const clearSearch = () => {
    setQuery('');
    inputRef.current?.blur();
  };

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      <StatusBar style={t.statusBar} />

      {/* Header */}
      <View style={s.header}>
        <Text style={s.headerTitle}>Eventos cerca de ti</Text>
        <View style={s.headerSubRow}>
          <FontAwesome
            name={coordinates ? 'map-marker' : permGranted === false ? 'ban' : 'circle-o-notch'}
            size={12}
            color={coordinates ? t.green : t.textTertiary}
            style={{ marginRight: 5 }}
          />
          <Text style={[s.headerSub, coordinates && { color: t.green }]}>
            {coordinates
              ? 'Ubicación activa'
              : permGranted === false
              ? 'Activa ubicación para ver distancias'
              : 'Buscando ubicación…'}
          </Text>
        </View>
      </View>

      {/* Buscador */}
      <View style={s.searchWrapper}>
        <View style={[s.searchBar, searchFocused && s.searchBarFocused]}>
          <FontAwesome name="search" size={14} color={t.textTertiary} style={s.searchIcon} />
          <TextInput
            ref={inputRef}
            style={s.searchInput}
            placeholder="Buscar por nombre, recinto…"
            placeholderTextColor={t.textTertiary}
            value={query}
            onChangeText={setQuery}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            returnKeyType="search"
            clearButtonMode="never"
            autoCorrect={false}
            autoCapitalize="none"
          />
          {query.length > 0 && (
            <Pressable onPress={clearSearch} style={s.clearBtn} hitSlop={8}>
              <FontAwesome name="times-circle" size={15} color={t.textTertiary} />
            </Pressable>
          )}
        </View>
      </View>

      {/* Filtros de categoría */}
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
        <ScrollView
          scrollEnabled={false}
          contentContainerStyle={s.list}
        >
          {Array.from({ length: 5 }).map((_, i) => (
            <EventCardSkeleton key={i} />
          ))}
        </ScrollView>
      ) : error ? (
        <View style={s.center}>
          <Text style={s.errorEmoji}>⚠️</Text>
          <Text style={s.errorText}>{error}</Text>
          <Pressable style={s.retryBtn} onPress={() => loadEvents(selectedCat)}>
            <Text style={s.retryText}>Reintentar</Text>
          </Pressable>
        </View>
      ) : filtered.length === 0 ? (
        <View style={s.center}>
          <Text style={s.emptyEmoji}>{query ? '🔍' : '📭'}</Text>
          <Text style={s.emptyTitle}>
            {query ? 'Sin resultados' : 'Sin eventos'}
          </Text>
          <Text style={s.emptySubtitle}>
            {query
              ? `No se encontraron eventos para "${query}"`
              : 'No hay eventos de esta categoría cerca de ti.'}
          </Text>
          {query ? (
            <Pressable style={s.retryBtn} onPress={clearSearch}>
              <Text style={s.retryText}>Limpiar búsqueda</Text>
            </Pressable>
          ) : null}
        </View>
      ) : (
        <FlashList
          data={filtered}
          estimatedItemSize={260}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <EventCard event={item} onPress={() => router.push(`/(app)/event/${item.id}`)} />
          )}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={t.primary} />
          }
          contentContainerStyle={s.list}
          keyboardShouldPersistTaps="handled"
        />
      )}
    </SafeAreaView>
  );
}

function makeStyles(t: Theme) {
  return StyleSheet.create({
    container:        { flex: 1, backgroundColor: t.background },
    header:           { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8 },
    headerTitle:      { fontSize: 24, fontWeight: '800', color: t.text },
    headerSubRow:     { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
    headerSub:        { fontSize: 13, color: t.textSecondary },

    // Search
    searchWrapper:    { paddingHorizontal: 16, paddingBottom: 8 },
    searchBar:        {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: t.surface,
      borderRadius: 12,
      borderWidth: 1.5,
      borderColor: t.border,
      paddingHorizontal: 12,
      height: 42,
    },
    searchBarFocused: { borderColor: t.primary },
    searchIcon:       { marginRight: 8 },
    searchInput:      {
      flex: 1,
      fontSize: 14,
      color: t.text,
      paddingVertical: 0,
      height: '100%',
    },
    clearBtn:         { padding: 2, marginLeft: 6 },

    // Category chips
    filtersScroll:    { maxHeight: 52, flexShrink: 0 },
    filtersRow:       { paddingHorizontal: 16, paddingVertical: 10, gap: 8 },
    chip:             { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20, backgroundColor: t.surface, borderWidth: 1.5, borderColor: t.border },
    chipActive:       { backgroundColor: t.primary, borderColor: t.primary },
    chipText:         { fontSize: 13, fontWeight: '600', color: t.textSecondary },
    chipTextActive:   { color: '#fff' },

    list:             { paddingVertical: 8, paddingBottom: 24 },
    center:           { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
    errorEmoji:       { fontSize: 48, marginBottom: 12 },
    errorText:        { color: t.red, textAlign: 'center', marginBottom: 16 },
    retryBtn:         { marginTop: 16, backgroundColor: t.primary, borderRadius: 10, paddingHorizontal: 24, paddingVertical: 10 },
    retryText:        { color: '#fff', fontWeight: '600' },
    emptyEmoji:       { fontSize: 48, marginBottom: 12 },
    emptyTitle:       { fontSize: 18, fontWeight: '700', color: t.text, marginBottom: 8 },
    emptySubtitle:    { fontSize: 14, color: t.textSecondary, textAlign: 'center' },
  });
}
