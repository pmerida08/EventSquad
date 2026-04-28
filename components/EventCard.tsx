import { Image } from 'expo-image';
import { View, Text, StyleSheet, Pressable } from 'react-native';

import { formatEventDate, formatDistance } from '@/lib/events';
import type { EventNear, EventRow } from '@/lib/events';

// Acepta tanto EventRow (sin distancia) como EventNear (con distancia)
type EventCardProps = {
  event: EventRow | EventNear;
  onPress: () => void;
};

const CATEGORY_COLORS: Record<string, string> = {
  concierto:   '#6366F1',
  festival:    '#F59E0B',
  'electrónica': '#EC4899',
  flamenco:    '#EF4444',
  fiesta:      '#10B981',
};

export function EventCard({ event, onPress }: EventCardProps) {
  const color = CATEGORY_COLORS[event.category] ?? '#6366F1';
  const distanceKm = 'distance_km' in event ? (event as EventNear).distance_km : null;

  return (
    <Pressable style={styles.card} onPress={onPress} android_ripple={{ color: '#E0E7FF' }}>
      {/* Imagen */}
      {event.image_url ? (
        <Image
          source={{ uri: event.image_url }}
          style={styles.image}
          contentFit="cover"
          transition={200}
        />
      ) : (
        <View style={[styles.imagePlaceholder, { backgroundColor: color + '22' }]}>
          <Text style={[styles.imagePlaceholderText, { color }]}>🎵</Text>
        </View>
      )}

      <View style={styles.body}>
        {/* Categoría + distancia */}
        <View style={styles.meta}>
          <View style={[styles.categoryBadge, { backgroundColor: color + '18' }]}>
            <Text style={[styles.categoryText, { color }]}>{event.category.toUpperCase()}</Text>
          </View>
          {distanceKm !== null && (
            <Text style={styles.distance}>{formatDistance(distanceKm)}</Text>
          )}
        </View>

        {/* Nombre */}
        <Text style={styles.name} numberOfLines={2}>{event.name}</Text>

        {/* Venue y fecha */}
        <Text style={styles.venue} numberOfLines={1}>📍 {event.venue}</Text>
        <Text style={styles.date}>🗓 {formatEventDate(event.date)}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  image: { width: '100%', height: 160 },
  imagePlaceholder: {
    width: '100%',
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imagePlaceholderText: { fontSize: 40 },
  body: { padding: 14 },
  meta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  categoryBadge: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3 },
  categoryText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
  distance: { fontSize: 13, color: '#6B7280', fontWeight: '500' },
  name: { fontSize: 17, fontWeight: '700', color: '#111827', marginBottom: 6, lineHeight: 23 },
  venue: { fontSize: 13, color: '#6B7280', marginBottom: 3 },
  date: { fontSize: 13, color: '#6B7280' },
});
