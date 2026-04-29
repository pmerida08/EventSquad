import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Image } from 'expo-image';
import { View, Text, StyleSheet, Pressable } from 'react-native';

import { useTheme } from '@/constants/theme';
import { formatEventDate, formatDistance } from '@/lib/events';
import type { EventNear, EventRow } from '@/lib/events';

type EventCardProps = {
  event: EventRow | EventNear;
  onPress: () => void;
};

const CATEGORY_COLORS: Record<string, string> = {
  concierto:    '#6366F1',
  festival:     '#F59E0B',
  'electrónica':'#EC4899',
  flamenco:     '#EF4444',
  fiesta:       '#10B981',
};

export function EventCard({ event, onPress }: EventCardProps) {
  const t = useTheme();
  const s = makeStyles(t);

  const color      = CATEGORY_COLORS[event.category] ?? '#6366F1';
  const distanceKm = 'distance_km' in event ? (event as EventNear).distance_km : null;

  return (
    <Pressable
      style={s.card}
      onPress={onPress}
      android_ripple={{ color: t.primaryBg }}
      accessibilityRole="button"
      accessibilityLabel={`Evento: ${event.name}`}
    >
      {/* Imagen */}
      {event.image_url ? (
        <Image
          source={{ uri: event.image_url }}
          style={s.image}
          contentFit="cover"
          transition={200}
        />
      ) : (
        <View style={[s.imagePlaceholder, { backgroundColor: color + '22' }]}>
          <FontAwesome name="music" size={36} color={color} />
        </View>
      )}

      <View style={s.body}>
        {/* Categoría + distancia */}
        <View style={s.meta}>
          <View style={[s.categoryBadge, { backgroundColor: color + '18' }]}>
            <Text style={[s.categoryText, { color }]}>
              {event.category.toUpperCase()}
            </Text>
          </View>
          {distanceKm !== null && (
            <View style={s.distanceRow}>
              <FontAwesome name="location-arrow" size={11} color={t.textTertiary} style={{ marginRight: 4 }} />
              <Text style={s.distance}>{formatDistance(distanceKm)}</Text>
            </View>
          )}
        </View>

        {/* Nombre */}
        <Text style={s.name} numberOfLines={2}>{event.name}</Text>

        {/* Venue */}
        <View style={s.infoRow}>
          <FontAwesome name="map-marker" size={12} color={t.textTertiary} style={s.infoIcon} />
          <Text style={s.infoText} numberOfLines={1}>{event.venue}</Text>
        </View>

        {/* Fecha */}
        <View style={s.infoRow}>
          <FontAwesome name="calendar" size={11} color={t.textTertiary} style={s.infoIcon} />
          <Text style={s.infoText}>{formatEventDate(event.date)}</Text>
        </View>
      </View>
    </Pressable>
  );
}

function makeStyles(t: ReturnType<typeof useTheme>) {
  return StyleSheet.create({
    card: {
      backgroundColor: t.surface,
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
    image:            { width: '100%', height: 160 },
    imagePlaceholder: { width: '100%', height: 100, alignItems: 'center', justifyContent: 'center' },
    body:             { padding: 14 },
    meta:             { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
    categoryBadge:    { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3 },
    categoryText:     { fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
    distanceRow:      { flexDirection: 'row', alignItems: 'center' },
    distance:         { fontSize: 13, color: t.textSecondary, fontWeight: '500' },
    name:             { fontSize: 17, fontWeight: '700', color: t.text, marginBottom: 8, lineHeight: 23 },
    infoRow:          { flexDirection: 'row', alignItems: 'center', marginBottom: 3 },
    infoIcon:         { width: 16, textAlign: 'center', marginRight: 6 },
    infoText:         { flex: 1, fontSize: 13, color: t.textSecondary },
  });
}
